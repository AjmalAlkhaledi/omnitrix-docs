# ADR-005: Primary-key row cache in the database engine

Status: Accepted (2026-11-15)

## Context

Applications want database reads served from Redis without invalidating a whole table on every
write, which makes caching useless for busy tables. The starting proposal ("plan Z") was a cache
inside the engine with:

- one entry per primary key;
- version-based invalidation, with version keys that never expire;
- writes intercepted in the query builder: affected keys found with `SELECT … FOR UPDATE`, then
  the statement run by key;
- invalidation after commit through `afterCommit()` with nested-transaction semantics;
- no caching of query results;
- an outbox for invalidations lost when Redis fails after a commit.

## Decision

Build the cache into the engine (`Omnitrix\Core\Database\Cache`) as proposed, with these
changes:

1. **One round trip per read.** Entries store the version they were read under; a read is a
   single `MGET` of the row's version, the entry, the table's insert epoch and generation. The
   proposal needed two sequential reads (version, then a versioned key) and left an orphaned key
   behind on every write.
2. **Mark before the write, publish after.** A version is a random token plus a count of pending
   writers. Writes increment the count before the statement and install a fresh token when the
   outermost transaction ends. While a write is pending, readers bypass the cache. This closes the
   window between commit and invalidation that remains when invalidating only after commit, and
   makes a Redis failure after commit harmless (the mark stays, readers use the database), so no
   outbox is needed.
3. **Guarded fills.** A reader stores its result only if the version is unchanged and nothing is
   pending (Lua script), so a slow reader cannot store data older than a committed write.
4. **Expiring versions.** Because tokens are random, an expired version can never revalidate an
   old entry; versions can expire, and memory stays bounded. The proposal kept version keys
   forever.
5. **Opt-in per table.** Only configured tables (and tables whose foreign keys cascade into
   them) take part; other writes run unchanged.
6. **No locking read when the statement already names its rows.** `where('id', …)` and
   `whereIn('id', …)` — every model save and delete — mark the keys directly. Only other
   conditions use `SELECT … FOR UPDATE` (with automatic transaction wrapping).
7. **Absent rows via an insert epoch.** Multi-row inserts with generated keys cannot say which
   keys they create; cached absent answers are validated against a per-table epoch that every
   insert changes. Positive entries do not depend on it.
8. **Foreign-key cascades.** `ON DELETE/UPDATE CASCADE | SET NULL` change rows inside the
   database; the engine reads the foreign keys from `information_schema` and marks the cascaded
   rows of cached tables. The proposal did not cover this; without it, deleted children would
   stay cached.
9. **Table generation.** Schema changes (create, alter, drop, rename, `migrate:fresh`) retire all
   entries of the table at once, so ids reused after a truncate or rebuild are not served stale.
10. **Reads in transactions bypass the cache**, so a transaction sees its own writes.
11. **Query results by value tags** (the proposal's later phase). A query opted in with
    `cache()` depends on one `=`/`IN` condition on a tracked column. Because the top-level
    conditions are joined with AND, a row can only be in the result if that column holds one of
    the filtered values; writes mark the tags of the affected rows' old and new values with the
    same protocol as rows. Text tags are the column collation's `WEIGHT_STRING()` (after trimming
    trailing spaces), so values equal under the collation share a tag; trimming can only merge
    tags, which over-invalidates but never misses. Values a write cannot know in advance (database
    defaults, computed assignments) mark a column-wide key.

## Consequences

- Lookups by key on cached tables cost one Redis round trip on a hit. A write costs one extra
  round trip before and one after (batched per statement), plus a locking select for writes that
  do not name their rows.
- Raw SQL, triggers and changes from other applications are invisible to the engine: they need
  `DB::writing()`, `DB::invalidate()` or `flushCache()`.
- Queries with `OR`, joins or no condition on a tracked column are not cached; widening this
  needs predicate analysis beyond single conjuncts.

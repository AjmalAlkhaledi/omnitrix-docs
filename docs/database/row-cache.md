---
sidebar_position: 7
---

# Row cache

Omnitrix can cache rows of chosen tables in Redis, **one entry per primary key**. A write
invalidates only the rows it changes — never the whole table — and it does so automatically: no
cache calls in controllers, models or jobs.

```php
// config/database.php
'cache' => [
    'tables' => ['users', 'products'],
    'ttl' => 300,
],
```

```php
$user = User::find(10);            // Redis (after the first read)
$user->name = 'Ahmed';
$user->save();                     // only users #10 is invalidated

DB::table('users')->where('status', 'inactive')->update(['status' => 'active']);
// only the rows that matched are invalidated
```

The cache needs the `redis` configuration; workers fail to start with a configuration error when
a connection enables the cache without it.

## What is cached

Plain lookups by primary key on a cached table:

| Code | Served from the cache |
|---|---|
| `User::find($id)`, `findOrFail()`, `findMany([...])` | yes |
| `DB::table('users')->find($id)`, `->where('id', $id)->first()`, `->whereIn('id', [...])->get()` | yes |
| `$post->user` and `Post::with('user')` (`belongsTo`) | yes, one round trip for all keys |
| composite keys: `->where('user_id', 1)->where('team_id', 7)->first()` | yes |
| anything else: other conditions, `select()` of columns, joins, ordering, `count()`, `hasMany` | no — the database is queried |

Rows that do not exist are cached too ("absent" answers, `negative_ttl`), so repeated lookups of
missing ids do not reach the database.

Reads **inside a transaction** always use the database: they must see the transaction's own
uncommitted writes.

Query results (`where('status', 'active')->get()`) are not cached: a write can add a row to or
remove a row from such a result without touching any row the result contained, so per-row
invalidation cannot keep them correct.

## What invalidates

Every write made through the query builder, models or the `DB` facade:

| Write | Invalidated |
|---|---|
| `update` / `delete` by key (model `save()`, `delete()`, `where('id', …)`, `whereIn('id', …)`) | those keys |
| `update` / `delete` with any other condition | exactly the matching rows: Omnitrix selects their keys with `SELECT … FOR UPDATE` in a transaction and runs the statement by key |
| `insert`, `insertGetId` | cached absent answers of the table |
| changing a primary key value | the old key and absent answers |
| deletes and key updates that cascade (`ON DELETE CASCADE`, `ON DELETE SET NULL`, `ON UPDATE CASCADE`, …) into cached tables | the cascaded rows, several levels deep |
| creating, altering, renaming or dropping a cached table with the schema builder, `migrate:fresh` | every entry of that table |

Writes to tables that are not cached run exactly as before, with no extra work.

## Consistency

- A reader is never served a value older than a committed write. Each row's version is
  **marked before** a write statement runs; while it is marked, readers bypass the cache and read
  the database. When the transaction ends, the row gets a fresh random version, which retires
  everything cached before or during the write.
- A slow reader cannot store stale data: its result is stored only if the row's version is still
  the one it saw before reading the database.
- If Redis fails after a commit, the marks stay until `lock_ttl` expires, so readers keep using
  the database; nothing stale is served.
- If Redis is unavailable, reads use the database and writes still run (strict mode can refuse
  writes instead, see below).
- Entries expire after `ttl` seconds in any case.

## Writes the builder does not see

| Situation | Use |
|---|---|
| raw SQL that changes known rows | `DB::writing('users', [10, 11], fn () => DB::execute('update users set …'))` |
| raw SQL that may insert rows | `DB::writing('users', $ids, $write, inserts: true)` |
| rows changed by another application, a trigger or a manual fix | `DB::invalidate('users', [10, 11])` (`absent: true` also clears absent answers) |
| a table changed wholesale (`TRUNCATE`, bulk import, restore) | `DB::connection()->flushCache('users')` |

Composite keys are given as tuples in key column order: `DB::invalidate('memberships', [[1, 7]])`.

## After commit

```php
DB::transaction(function () use ($order): void {
    $order->update(['status' => 'paid']);
    DB::afterCommit(fn () => Queue::dispatch('orders.paid', ['id' => $order->id]));
});
```

`DB::afterCommit()` runs the callback once the outermost transaction has committed (immediately
outside a transaction). Callbacks registered in a nested transaction that rolls back are
discarded; a rolled back or retried transaction discards all of them.

## Configuration

| Key | Default | Meaning |
|---|---|---|
| `tables` | — | tables to cache: `['users', 'products']`; the primary key is read from the schema. Give the key columns explicitly with `['memberships' => ['user_id', 'team_id']]` |
| `ttl` | 300 | seconds a cached row lives |
| `negative` | `true` | also cache "row does not exist" answers |
| `negative_ttl` | 60 | seconds an absent answer lives |
| `lock_ttl` | 30 | seconds a mark from an unfinished write lives (should exceed your longest transaction) |
| `strict` | `false` | refuse writes to cached tables when Redis cannot be updated before them |
| `prefix` | `dbc` | Redis key prefix (inside the `redis.prefix`) |
| `enabled` | `true` when tables are listed | switch the cache off without removing the list |

`DB::connection()->cacheStats()` returns hits, misses, bypassed reads and errors of the current
worker.

## Limits

- **Triggers** that change other tables are not tracked; invalidate those rows with
  `DB::invalidate()`.
- **Composite foreign keys** are not followed for cascades.
- Rows changed **outside the application** stay cached until they expire unless you invalidate
  them.
- Schema changes made while workers run are picked up after a reload (`SIGUSR1`) or restart, as
  with any deployment.
- Redis Cluster is not supported (a lookup reads several keys in one `MGET`).
- Large bulk updates on cached tables lock and invalidate every affected row; keep them to
  maintenance windows or run them in batches.

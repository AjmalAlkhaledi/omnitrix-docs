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

The cache needs the `redis` configuration; `Application::create()` rejects a connection that
enables the cache without it.

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

Query results are cached only when you ask for it, see [Query cache](#query-cache).

## What invalidates

Every write made through the query builder, models or the `DB` facade:

| Write | Invalidated |
|---|---|
| `update` / `delete` by key (model `save()`, `delete()`, `where('id', …)`, `whereIn('id', …)`) | those keys |
| `update` / `delete` with any other condition | exactly the matching rows: Omnitrix selects their keys with `SELECT … FOR UPDATE` in a transaction and runs the statement by key |
| `insert`, `insertGetId` | cached absent answers of the table |
| changing a primary key value | the old key and absent answers |
| deletes and key updates that cascade (`ON DELETE CASCADE`, `ON DELETE SET NULL`, `ON UPDATE CASCADE`, …) into cached tables | the cascaded rows, several levels deep, composite foreign keys included |
| writes to a table whose triggers write to cached tables (directly, through other triggers or through foreign-key cascades) | every entry of those tables, row and query cache |
| creating, altering, renaming or dropping a cached table with the schema builder, `migrate:fresh` | every entry of that table |

Writes to tables that are not cached, and that have no triggers or cascades reaching a cached
table, run exactly as before, with no extra work.

### Triggers

The rows a trigger changes cannot be known before it runs, so Omnitrix handles triggers per
table. It reads the triggers of the database from `information_schema` and finds the tables their
bodies write to (`INSERT`, `UPDATE`, `DELETE`, `REPLACE`), following the triggers and foreign-key
cascades of those tables in turn. A write to the trigger's table, for the events the trigger
fires on (an upsert also counts as an update, `REPLACE` also as a delete), then:

1. marks the target tables before it runs: lookups of those tables read the database and nothing
   is stored for them until the write ends;
2. retires every entry of the target tables when it commits; a rollback keeps them.

A trigger that calls a stored procedure, or uses a join or a prepared statement, may write any
table: writes to its table retire every cached table of the connection. Prefer triggers that
write a single table when that table is cached and written often.

## Consistency

The cache is built so that **no reader is served a value older than a committed write**, also
when Redis fails or restarts:

- **Marked writes.** Each affected row (or query tag) is marked in Redis *before* the write
  statement runs. While it is marked, readers bypass the cache and read the database. When the
  outermost transaction commits, the row gets a fresh random version, which retires everything
  cached before or during the write.
- **Rollbacks keep the cache.** A transaction (or a nested transaction) that rolls back releases
  its marks without retiring anything: the rows did not change. A deadlock retry is a rollback
  followed by a new attempt, so only the attempt that commits invalidates.
- **Guarded fills.** A slow reader stores its result only if the row's version is still the one it
  saw before reading the database and nothing is marked.
- **Long transactions.** Marks are renewed every third of `lock_ttl` while the write runs, so a
  transaction longer than `lock_ttl` keeps its rows marked until it ends.
- **Redis restarts.** Every new Redis connection compares the server's `run_id` with the one
  recorded when the cache was last complete. A restarted (or failed-over) server may have loaded
  data saved before writes it never saw, so every cached table is retired before anything is
  served from it.
- **Redis unavailable before a write.** With `strict` (the default) the write is refused with
  `CacheUnavailableException` and the database is not changed; an HTTP request that hits it
  answers `503 Service Unavailable` with `Retry-After: 1`, so clients and load balancers can
  retry. With `strict => false` the write
  runs; the affected keys become a debt of that worker, invalidated as soon as Redis answers, and
  the worker reads from the database meanwhile. Other workers that can still reach Redis may
  serve the old row until then — choose `strict => false` only when write availability matters
  more than that window.
- **Commits with an unknown outcome** (connection lost during `COMMIT`) invalidate, as if they
  committed.
- Reads use the database whenever Redis cannot be reached. Entries expire after `ttl` seconds in
  any case.

## Query cache

Results of other queries can be cached too, per query, when they filter on a column you list:

```php
// config/database.php
'cache' => [
    'tables' => ['users'],
    'queries' => ['posts' => ['user_id', 'status']],
],
```

```php
$posts = Post::where('user_id', $user->id)->latest()->cache(60)->get();
$count = DB::table('posts')->where('status', 'published')->cache(60)->count();
$page = Post::where('user_id', $id)->orderBy('id')->cache(60)->paginate(20, $page);
```

A cached result depends on the **values** it filters on, not on the table. It is invalidated when a
row whose tracked column holds one of those values is written — the value before the write or
after it:

| Write | `where('user_id', 1)` results |
|---|---|
| update a post of user 2 | kept |
| update a post of user 1 | invalidated |
| move a post from user 2 to user 1 (or back) | invalidated (and user 2's results too) |
| insert or delete a post of user 1, cascade delete of user 1 | invalidated |
| insert without `user_id`, `increment('user_id')` | invalidated: the new value is not known in advance |

How it works:

- The query is cached when its top-level conditions are joined with `AND` and one of them is
  `col = ?` or `col IN (…)` on a tracked column; any other conditions, ordering, limits and
  aggregates (`count()`, `exists()`, `sum()`, …) are allowed. A row can only be in such a result if
  its column holds one of the filtered values, so watching those values is enough.
- Text values are compared like the column's collation (`'Active'`, `'ACTIVE '` and `'active'` are
  the same value in `utf8mb4_unicode_ci`); integers by value.
- Writes to tables with tracked columns read the old values of the affected rows with
  `SELECT … FOR UPDATE` (in the same transaction) before they run, and use the same mark/publish
  protocol as rows, so the consistency guarantees above apply to query results too.

Not cached (they run against the database every time, even with `cache()`): `OR` at the top
level, joins, queries without an `=`/`IN` condition on a tracked column, and queries inside a
transaction. Tracked columns must be integer, `char`, `varchar`, `text` or `enum` columns.

## Which API to use

| Situation | API |
|---|---|
| read a row by key | nothing to do: `User::find(10)`, `DB::table('users')->find(10)` |
| read a list that filters on a tracked column | `Post::where('user_id', 1)->cache(60)->get()` |
| write through models or the query builder | nothing to do: invalidation is automatic |
| write with raw SQL to known rows | `DB::writing('users', [10], fn () => DB::execute('update users set score = score + 1 where id = 10'))` |
| raw SQL that may insert rows | `DB::writing('users', $ids, $write, inserts: true)` |
| rows changed outside the application (another service, a trigger, a manual fix) | `DB::invalidate('users', [10])` (`absent: true` also clears cached "does not exist" answers) |
| a table changed wholesale (`TRUNCATE`, bulk import, restore) | `DB::connection()->flushCache('users')` |
| run code only once the data is committed (send mail, dispatch a job) | `DB::afterCommit(fn () => …)` |

```php
use Omnitrix\Facades\DB;

// Raw SQL the query builder cannot express: mark the rows while it runs.
DB::writing('users', [10, 11], fn (): int => DB::execute(
    'update users set score = score + ? where id in (10, 11)', [5],
));

// A nightly job outside the application changed users 7 and 9.
DB::invalidate('users', [7, 9]);

// Composite keys are tuples in key column order.
DB::invalidate('memberships', [[1, 7]]);

// The whole table was reloaded from a backup.
DB::connection()->flushCache('products');
```

### Queries that skip the cache automatically

Even with `cache()`, these always read the database: queries inside a transaction, locking reads
(`lockForUpdate()`), joins, `OR` at the top level, `select()` of specific columns for row
lookups, and queries without an `=`/`IN` condition on a tracked column.

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
| `queries` | — | columns cached queries may filter on, per table: `['posts' => ['user_id', 'status']]` |
| `ttl` | 300 | seconds a cached row lives |
| `negative` | `true` | also cache "row does not exist" answers |
| `negative_ttl` | 60 | seconds an absent answer lives |
| `lock_ttl` | 30 | seconds a mark lives without renewal. Running writes renew their marks, so this only bounds how long a crashed worker's marks keep readers on the database |
| `strict` | `true` | refuse writes to cached tables when Redis cannot be marked before them (see [Consistency](#consistency)) |
| `prefix` | `dbc` | Redis key prefix (inside the `redis.prefix`) |
| `enabled` | `true` when tables or queries are listed | switch the cache off without removing the lists |

`DB::connection()->cacheStats()` returns hits, misses, bypassed reads and errors of the current
worker; with metrics enabled they are exported as the counters
`omnitrix_db_cache_{hits,misses,bypassed,errors}_total`, labelled with the connection and the
worker that served the scrape (like the pool statistics, see [Observability](../operations/observability.md)).
A cache configured without the `redis` section is rejected when the application is created.

## Limits

- **Changes outside the application** stay cached until they expire unless you invalidate them.
- **Redis Cluster** is not supported: a lookup reads a row's keys and its table's keys with one
  `MGET`. Use a single Redis server; if the application is pointed at another server (a
  replica promoted after a failure), the different `run_id` is handled like a restart.
- **Query cache eligibility**: see [Query cache](#query-cache); queries that do not qualify run
  against the database.
- Schema changes (triggers included) made outside the schema builder while workers run are picked up after a reload
  (`SIGUSR1`) or restart; changes made with the schema builder (`php omnitrix migrate`) are picked
  up immediately.
- Large bulk updates on cached tables lock and invalidate every affected row; run them in batches
  or maintenance windows.

## Measuring

`tools/bench/db_cache_bench.php` in the `omnitrix/core` repository measures lookups without the
cache, with the row cache, with the query cache, and writes with invalidation, at several table
sizes and levels of concurrency, and reports Redis memory and hit, miss, bypass and error rates.
Run it on hardware representative of production; in production, watch the
`omnitrix_db_cache_*_total` metrics.

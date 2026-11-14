# Query builder

The `DB` facade runs SQL and builds queries that return plain arrays. For objects with
relationships use [models](models.md), which are built on the same query builder.

## Usage

```php
<?php

use Omnitrix\Facades\DB;

$user = DB::table('users')->where('id', 10)->first();
$ids  = DB::table('users')->where('status', 'active')->orderByDesc('created_at')->limit(20)->pluck('id');
$id   = DB::table('users')->insertGetId(['name' => 'John', 'email' => 'john@example.com']);
DB::table('users')->where('id', $id)->update(['name' => 'Updated']);
DB::table('users')->where('id', $id)->increment('logins');
DB::table('users')->whereIn('id', [1, 2, 3])->delete();
$rows = DB::select('select id, name from users where email like ?', ['%@example.com']);

DB::transaction(function () {
    DB::table('accounts')->where('id', 1)->decrement('balance', 50);
    DB::table('accounts')->where('id', 2)->increment('balance', 50);
}, attempts: 3); // retried on deadlock
```

Builder features: `select/addSelect/distinct`, `where` (operators, arrays, nested closures,
`whereIn/NotIn/Null/NotNull/Between/Column/Raw`, `orWhere`), joins, `groupBy/having`,
`orderBy`, `limit/offset`, `lockForUpdate`, `get/first/find/value/pluck/count/exists/sum/
max/min/avg`, `insert` (single or multi-row with identical columns), `insertGetId`, `update`,
`increment/decrement`, `delete` (refuses to run without a `where`). Raw SQL only through
`DB::raw()`/`Builder::raw()`; everything else is bound. Identifiers are back-tick quoted.

## Connection lifecycle

- Outside a transaction each statement leases a connection and returns it immediately, so a
  request waiting on other I/O between queries holds no connection.
- `DB::transaction()` leases one connection, pins it to the **current coroutine**, runs
  `BEGIN … COMMIT`, rolls back on any throwable and rethrows. Nested calls use savepoints.
  Child tasks started with `Async` inside a transaction get their own connections (a single
  connection cannot serve two coroutines).
- Pooled connections assert ownership: use from another coroutine or after release throws
  `OwnershipViolationException` instead of corrupting the protocol stream.
- Connections that failed with a connection-class error, were interrupted by cancellation, or
  come back mid-transaction are destroyed, never reused.
- `WorkerStop` drains the pool (waits for leases, bounded) and closes every connection.

## Errors

All in `Omnitrix\Core\Database\Exception`, extending `DatabaseException`:

| Exception | When | Typical HTTP mapping |
|---|---|---|
| `ConnectionException` | connect refused/timeout, server gone away, lost connection | 503 |
| `PoolExhaustedException` | no connection within `acquire_timeout` (backpressure) | 503 + Retry-After |
| `QueryTimeoutException` | statement exceeded `statement_timeout` (MariaDB 1969 / MySQL 3024) | 504 |
| `DeadlockException` | MySQL 1213; `transaction(..., attempts: n)` retries | 409 |
| `LockWaitTimeoutException` | MySQL 1205 | 409 |
| `UniqueConstraintViolationException` | MySQL 1062 | 409 |
| `ConstraintViolationException` | other SQLSTATE 23000 | 422 |
| `QueryException` | anything else; carries SQL (truncated) and SQLSTATE, never bound values | 500 |

## Timeouts and cancellation

Statement limits are enforced server-side (`max_statement_time` on MariaDB,
`max_execution_time` on MySQL, set once per connection) because `PDO::ATTR_TIMEOUT` does not
bound reads under runtime hooks. Pool waits are additionally capped by the request deadline
(`$request->context()->remainingTime()`). A coroutine cancelled while a query is in flight (timeout
in `Async::all`, request abort) receives the interruption as an exception; the connection is
discarded and the next statement gets a fresh one.

## Guarantees covered by the test suite

CRUD; bound values and quoted identifiers defeat injection; constraint errors are
classified; pool exhaustion is bounded by the acquisition timeout and recovers on release;
concurrent queries overlap while sibling coroutines keep running; commit, rollback, pinning
and savepoints; deadlocks are classified and retried; connect timeouts, closed ports and
statement timeouts; cancellation discards the connection; connections killed server-side are
detected on checkout; a full database restart is recovered without manual intervention.

## Platform notes

- Requires `pdo_mysql` on mysqlnd (libmysqlclient builds are not coroutine-compatible).
- PHP 8.5 deprecates `PDO::MYSQL_ATTR_INIT_COMMAND`; session statements run as plain `exec()`
  calls once per new connection instead.
- `pdo_pgsql` is not hooked by OpenSwoole and is therefore not supported.

---
sidebar_position: 1
---

# Database: getting started

Omnitrix talks to MySQL and MariaDB through PDO (mysqlnd) under OpenSwoole's runtime hooks:
every query suspends only the request that waits for it. Each worker process keeps a bounded
pool of connections, and a connection is used by exactly one coroutine at a time.

There are three layers, each built on the previous one:

| Layer | Use it for |
|---|---|
| [Raw SQL](#raw-sql) through the `DB` facade | reports, complex SQL, bulk statements |
| [Query builder](query-builder.md) | composing queries in code; returns arrays |
| [Models](models.md) with [relationships](relationships.md) | application data as objects; returns models |

Schema changes are made with [migrations](migrations.md); test and demo data with
[seeders](seeding.md).

## Configuration

`config/database.php` (the project reads the values from `.env`). Every option:

```php
return [
    'driver' => 'mariadb',            // or 'mysql'
    'host' => '127.0.0.1', 'port' => 3306, // or 'unix_socket' => '/run/mysqld/mysqld.sock'
    'database' => 'app', 'username' => 'app', 'password' => Env::required('DB_PASSWORD'),
    'charset' => 'utf8mb4', 'collation' => null, 'timezone' => null,
    'strict' => true,                 // STRICT_TRANS_TABLES & co. per session
    'connect_timeout' => 3.0,         // seconds (PDO::ATTR_TIMEOUT)
    'statement_timeout' => 30.0,      // server-side limit per statement, 0 = none
    'pool' => [
        'min' => 1, 'max' => 10,      // per worker process
        'acquire_timeout' => 5.0,     // seconds to wait for a free connection → PoolExhaustedException
        'idle_timeout' => 300.0,      // evict idle connections above min
        'max_lifetime' => 1800.0,     // recycle connections older than this
        'validation_interval' => 30.0,// ping on checkout when idle longer than this (0 = always)
        'eviction_interval' => 10.0,  // eviction timer period
    ],
];
```

The pool is **per worker process**: total connections = `server.workers` × `pool.max`. Keep that
below the database's `max_connections` across all servers.

For several databases, return named connections instead and pick one with
`DB::connection('reporting')` (models: `protected static ?string $connection = 'reporting';`):

```php
return [
    'default' => ['driver' => 'mariadb', 'host' => '10.0.0.5', /* ... */],
    'reporting' => ['driver' => 'mariadb', 'host' => '10.0.0.9', /* ... */],
];
```

Unknown keys and out-of-range values raise `InvalidConfigurationException` with the dotted path.

## Raw SQL

```php
use Omnitrix\Facades\DB;

$rows = DB::select('select id, name from users where created_at > ?', ['2026-01-01']);
$one = DB::selectOne('select count(*) as total from orders where user_id = ?', [$id]);
$affected = DB::execute('update users set active = 0 where last_login < ?', [$cutoff]);
$id = DB::insert('insert into audit_log (action) values (?)', ['login']);
```

Values are always bound, never interpolated.

## Transactions

```php
DB::transaction(function (): void {
    DB::table('accounts')->where('id', 1)->decrement('balance', 50);
    DB::table('accounts')->where('id', 2)->increment('balance', 50);
}, attempts: 3);   // retried on deadlock
```

The transaction runs on one connection, pinned to the current coroutine; models and the query
builder used inside the callback use it too. Any exception rolls back and is rethrown. Nested
calls create savepoints.

## Outside requests

Console commands, queue jobs and seeders have the same facades. In your own scripts, wrap the code
in `$app->withServices()`:

```php
$app = require __DIR__ . '/bootstrap.php';
$count = $app->withServices(fn (): int => User::query()->count());
```

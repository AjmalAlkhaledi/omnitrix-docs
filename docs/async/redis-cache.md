# Redis and Cache

Redis access through phpredis (>= 6.3) under OpenSwoole runtime hooks: concurrent commands,
including blocking ones such as `BLPOP`, overlap and sibling coroutines keep running.
Connections come from a bounded per-worker pool; each command leases one for its duration.

## Installation

phpredis (`ext-redis` 6.3 or later) must be installed and enabled for the PHP binary that runs
the application; see [Installation](../getting-started/installation.md#requirements).

## Configuration

```php
'redis' => [
    'host' => '127.0.0.1', 'port' => 6379, 'username' => null, 'password' => Env::get('REDIS_PASSWORD'),
    'database' => 0,
    'timeout' => 2.0,        // connect
    'read_timeout' => 5.0,   // bounds every read, including blocking commands
    'prefix' => 'app:',      // applied by phpredis to keys and pub/sub channels
    'pool' => ['max' => 16, 'acquire_timeout' => 3.0, 'idle_timeout' => 120.0, 'validation_interval' => 30.0],
],
'cache' => ['prefix' => 'cache:', 'ttl' => 3600],   // optional; the Cache facade needs 'redis'
```

## Usage

```php
<?php

use Omnitrix\Facades\Cache;
use Omnitrix\Facades\Redis;

Cache::set('user:10', $user, 3600);
$user = Cache::get('user:10');
Cache::delete('user:10');
$profile = Cache::remember('profile:10', 300, fn () => loadProfile(10));
$hits = Cache::increment('hits:home');

Redis::set('lock:job', '1', 30);
$replies = Redis::pipeline(function (\Redis $p): void { $p->incr('a'); $p->incr('b'); });
$replies = Redis::transaction(function (\Redis $m): void { $m->decrBy('stock', 1); $m->rPush('orders', 'o1'); });
Redis::publish('events', 'user.created');
```

`Redis::client()` returns the `Omnitrix\Core\Redis\RedisClient` behind the facade; it offers typed helpers for strings, counters,
expiry, hashes, lists (`blpop`), sets, `pipeline()`, `transaction()` (MULTI/EXEC),
`publish()`, `subscribe()` on a dedicated non-pooled connection (stops when the handler
returns false or its cancellation token fires), `command()` for anything else and
`withConnection()` for the raw phpredis handle.

The cache stores JSON (no `unserialize()`, so no object-injection risk); objects are not
reconstructed. A cached `null` is a value, not a miss.

## Errors

All in `Omnitrix\Core\Redis\Exception`, extending `RedisException`:

| Exception | When | Connection |
|---|---|---|
| `ConnectionException` | connect/auth failure, lost connection | discarded |
| `TimeoutException` | read timeout or no pooled connection within `acquire_timeout` | discarded (read) |
| `CommandException` | server error reply (WRONGTYPE, syntax…) | kept |

## Guarantees covered by the test suite

Commands, expiry, counters, hashes, lists and sets; large pipelines in one round trip;
MULTI/EXEC; concurrent blocking pops overlap while other coroutines keep running; pub/sub
across coroutines; read timeouts discard the connection; the pool maximum is enforced with
bounded waits; closed ports fail fast; a server restart is recovered transparently; the cache
is shared across workers with atomic increments.

## Platform notes

- phpredis reports server error replies as a `false` return plus `getLastError()`, not as
  exceptions; `RedisClient` converts them into `CommandException`.
- `OPT_PREFIX` also prefixes pub/sub channel names; `subscribe()` strips it before calling the
  handler.

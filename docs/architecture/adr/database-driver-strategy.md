# ADR-003: Database driver strategy — PDO/mysqlnd with a Core-owned pool

Status: Accepted (2026-11-11)

## Context

OpenSwoole no longer ships `Coroutine\MySQL`; the supported path is PDO or mysqli on mysqlnd
under runtime hooks. Core needs bounded pools with acquisition timeout, idle eviction,
validation, reconnection, graceful shutdown and transaction safety, and must never let two
coroutines share an active connection.

## Decision

- **Driver**: `PDO` (`pdo_mysql`, mysqlnd) under hooks, `ATTR_EMULATE_PREPARES=false`,
  `ERRMODE_EXCEPTION`, `utf8mb4`. PDO and mysqli behave identically under hooks; PDO's
  statement and binding API is sufficient.
- **Pool**: implemented in Core — channel-backed idle queue, `min`/`max`,
  `acquire_timeout` → `PoolExhaustedException`, `idle_timeout` and `max_lifetime` eviction by a
  worker timer, validation on checkout after an idle threshold, owner coroutine stamped on
  checkout, transaction pinning to the current coroutine, drain on shutdown, statistics.
- **Timeouts**: connect via `PDO::ATTR_TIMEOUT`; statements via `max_statement_time` (MariaDB)
  or `max_execution_time` (MySQL), because `PDO::ATTR_TIMEOUT` does not bound reads under hooks.
- **Error classification** by SQLSTATE and driver code: connection lost (2002, 2006, 2013),
  statement timeout (1969, 3024), deadlock (1213), lock wait (1205), duplicate key (1062),
  other constraint violations (23000), everything else.

## Why not `openswoole/core`'s `ClientPool` and `PDOClient`

`ClientPool` is a plain channel of clients without idle eviction, validation on checkout or
owner tracking. `PDOClient` forces `ERRMODE_SILENT`, converts errors through `__call` magic and
reconnects inside statement proxies, which hides failures in the middle of transactions. The
required semantics are small enough to implement and test directly.

## Consequences

- Integration tests run against a real MariaDB, including restart recovery.
- The query builder emits positional placeholders only; raw SQL fragments require an explicit
  `raw()` wrapper.

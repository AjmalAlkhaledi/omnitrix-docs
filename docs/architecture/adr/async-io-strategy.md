# ADR-002: Async I/O strategy — hooks for drivers, native coroutine clients for HTTP

Status: Accepted (2026-11-11)

## Context

"Async" must mean that a waiting request suspends only its own coroutine. OpenSwoole offers
runtime hooks that make blocking PHP APIs cooperative, and native coroutine clients. Each I/O
class Core needs was evaluated against both.

## Decision

| I/O class | Mechanism |
|---|---|
| Sleep / timers | `OpenSwoole\Timer` (`Sleep::for`); `Coroutine::sleep()` is not used for fractions |
| MySQL/MariaDB | PDO + mysqlnd under hooks |
| Redis | phpredis under hooks |
| Outbound HTTP/1.1 | **`OpenSwoole\Coroutine\Http\Client`** with per-origin bounded pools |
| Outbound HTTP/2 | `OpenSwoole\Coroutine\Http2\Client` |
| DNS | `Coroutine\System` (c-ares) |
| TCP/UDP | `Coroutine\Socket` |
| Files | hooked file functions and `Coroutine\System::readFile/writeFile` (AIO thread pool) |
| CPU work | separate processes with unix-socket IPC |

`OpenSwoole\Runtime::enableCoroutine(HOOK_ALL)` is applied once per worker before any I/O.

## Why not the native curl hook for HTTP

1. With the native curl hook active, `curl_exec()` to a host that libcurl resolves itself can
   crash the process inside OpenSwoole's curl multi integration; only pre-resolved hosts
   (`CURLOPT_RESOLVE`) are safe.
2. Connections are not reused across `curl_exec()` calls on an easy handle; reuse requires a
   persistent multi handle, which cannot be shared between coroutines.
3. With connection reuse on both sides, `Coroutine\Http\Client` is several times faster than
   the curl multi path.

## Guarantees Core adds on top of the runtime

- Exclusive ownership of pooled connections (checked before the runtime's fatal
  "socket bound to another coroutine" path).
- Timeouts at every layer: connect/read/total for HTTP; connect and server-side statement time
  for SQL; acquisition timeouts for pools.
- Bounded concurrency: pools, semaphores, `max_coroutine`.
- Structured scopes: child coroutines are joined or cancelled before their scope ends.

## Consequences

- Every I/O module has integration tests proving overlap (timing) and non-blocking behaviour
  (a sibling coroutine keeps ticking during the operation).
- `pdo_pgsql` is not hooked and is not supported.

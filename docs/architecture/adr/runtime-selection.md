# ADR-001: Runtime selection — OpenSwoole

Status: Accepted (2026-11-11)

## Context

Omnitrix needs one event loop, one coroutine scheduler and an HTTP server that can keep many
I/O-bound requests in flight per process. Candidates were OpenSwoole 26.x, Swoole 6.x and
userland event loops (ReactPHP, Amp/Revolt).

## Decision

Use **OpenSwoole (>= 26.2)** as the single runtime and lifecycle manager:
`OpenSwoole\Http\Server` for serving, OpenSwoole coroutines with runtime hooks (`HOOK_ALL`)
for cooperative I/O, server-managed processes for CPU isolation, the epoll reactor and the
default (assembly) coroutine context backend.

## Reasons

- 26.2 is a maintained release supporting PHP 8.3–8.5, with HTTP/2, OpenSSL, c-ares DNS and
  mysqlnd hooks.
- PDO/mysqlnd, phpredis, streams, sleep and file functions become genuinely cooperative under
  the runtime hooks: parallel queries overlap and sibling coroutines keep running.
- Server modes, reload, graceful shutdown, shared-memory tables and supervised processes are
  built in.
- The raw HTTP layer performs in the same range as compiled runtimes, so framework overhead is
  the variable to control.

## Known defects accepted with mitigations

- The native curl hook is unreliable with remote DNS resolution → the HTTP client uses
  `Coroutine\Http\Client` ([ADR-002](async-io-strategy.md)).
- `Coroutine::sleep()` truncates fractional seconds → Core provides a timer-based `Sleep::for()`.
- The io_uring reactor aborts on kernels < 5.1 → epoll by default, io_uring opt-in with a
  kernel check.
- The fiber context backend makes coroutine creation orders of magnitude slower → not enabled.

## Alternatives considered

- **Swoole 6.x**: same lineage; no concrete technical gain for this design. Re-evaluate if an
  OpenSwoole defect blocks a feature.
- **ReactPHP / Amp (Revolt)**: userland loops would require separate async database and Redis
  clients and cannot make PDO or phpredis cooperative; mixing loops is not an option.
- **PHP-FPM / RoadRunner**: no in-process concurrency for overlapping I/O within a request.

## Consequences

- All I/O libraries must be hook-compatible (mysqlnd-based) or OpenSwoole-native.
- Tests run inside a coroutine container (`bin/co-phpunit`).

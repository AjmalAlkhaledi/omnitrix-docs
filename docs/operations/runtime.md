# Runtime

`Application::run()` starts an OpenSwoole HTTP server, manages worker lifecycles, binds a
request context to every request coroutine, contains failures and tears resources down in
order. This page describes that behaviour and the hooks applications can use.

## Process model

```
Application::create(config) ── validates every section
        │
        ▼
Application::run() ── builds the OpenSwoole server and registers lifecycle events
        │
        ├─ master / manager processes: accept, dispatch, restart crashed workers,
        │   handle SIGTERM (shutdown) and SIGUSR1 (reload)
        │
        └─ worker processes 1..N ── each: WorkerStart → requests… → WorkerExit (drain) → WorkerStop
```

The default mode is **process** (`OpenSwoole\Server::POOL_MODE`): in-flight requests drain on
SIGTERM and connections survive a worker crash. `simple` mode is available
(`server.mode = 'simple'`) with one limitation: on SIGTERM the worker's event loop exits
immediately, so requests suspended on I/O or timers get their connection closed (reload
still drains).

## Configuration (`server` section)

| Key | Default | Meaning |
|---|---|---|
| `host`, `port` | `127.0.0.1`, `8080` | listen address |
| `mode` | `process` | `process` or `simple` (see above) |
| `workers` | CPU count | HTTP worker processes |
| `max_coroutine` | 10000 | per-worker coroutine cap; requests beyond it get `503` |
| `max_request` | 0 | recycle a worker after N requests (0 = never) |
| `max_wait_time` | 10 | seconds a draining worker may take before being killed |
| `backlog` | 512 | listen backlog |
| `reactor` | `epoll` | `io_uring` is refused on kernels < 5.1 |
| `hook_flags` | `HOOK_ALL` | OpenSwoole runtime hooks enabled in each worker |
| `log_file`, `log_level` | stderr, `warning` | OpenSwoole's own log |
| `pid_file` | none | master pid file |
| `enable_reuse_port`, `reload_async`, `tcp_nodelay`, `http2`, `daemonize` | false, true, true, false, false | |
| `package_max_length` | 2 MiB | maximum request size accepted by the parser |
| `buffer_output_size` | 2 MiB | maximum single write |
| `options` | `[]` | raw OpenSwoole options; the explicit keys above take precedence |

## Scopes

| Scope | Holder | Lifetime |
|---|---|---|
| Process | `Application` | until the master exits |
| Worker | worker container, built in `WorkerStart`; extend it with `configureContainer()` | until `WorkerStop` |
| Request | the request context (`$request->context()`) | until the response is sent and deferred callbacks ran |
| Child coroutine | inherits the parent's request context | must finish before the request does |

Coroutines started through `Async` (see [concurrency.md](../async/concurrency.md)) keep the request
context. Raw `OpenSwoole\Coroutine::create()` children lose it once their parent finishes, and
an uncaught exception in a raw coroutine is fatal for the worker, so prefer `Async`.

## Request context

`$request->context()` returns the request's `RequestContext`:

- `id` — 32-hex request id, also sent in the `X-Request-Id` response header;
- `remainingTime()` — seconds until the request deadline (`http.request_timeout`); pools and
  the HTTP client cap their waits with it;
- `set()/get()` — request-scoped attributes;
- `defer(callable)` — run cleanup after the response was sent (LIFO, each isolated).

## Request entry and failures

1. A request context is created and bound to the request coroutine.
2. Routing, middleware and the handler run.
3. Exceptions become JSON error responses (see [requests-responses.md](../basics/requests-responses.md));
   anything unexpected is reported to the exception handler with the request id and answered
   with a generic `500`. No stack traces leave the process.
4. Deferred callbacks run and the context is released.

## Worker hooks

```php
<?php

use Omnitrix\Application;
use Omnitrix\Core\Runtime\Worker\WorkerContext;

$app = Application::create(['server' => ['port' => 8080, 'workers' => 2]]);

$app->configureContainer(static function (WorkerContext $worker): void {
    // Worker-scoped services; handler classes are resolved from this container.
    $worker->container->singleton(ReportService::class, static fn (): ReportService => new ReportService());
});

$app->onWorkerStart(static function (WorkerContext $worker): void {
    $client = SearchClient::connect();
    // Release it when the worker stops (higher priority first).
    $worker->resources->register('search', static fn () => $client->close(), priority: 50);
});

$app->onWorkerStop(static function (WorkerContext $worker): void {
    // Runs before registered resources are released. Do not use coroutine APIs here.
});
```

- `WorkerStart`: runtime hooks enabled, PHP warnings converted to exceptions, worker
  container built (database, Redis, cache, HTTP client and queue services when configured),
  then `configureContainer` and `onWorkerStart` listeners in order.
- A `WorkerStart` listener that suspends on I/O does not delay request dispatch: requests are
  delivered as soon as the callback yields. Register services first and warm them up last.
- `WorkerExit`: the worker is draining (reload or graceful stop); nothing is torn down yet.
- `WorkerStop`: `onWorkerStop` listeners in reverse order, then registered resources
  (higher priority first), then all timers are cleared. Runs exactly once per worker.
- `WorkerError`: logged with exit code and signal; the manager respawns the worker.

## Signals

| Signal | Target | Effect |
|---|---|---|
| SIGTERM / SIGINT | master | graceful shutdown (process mode drains) |
| SIGUSR1 | master | graceful reload of all workers |

Queue workers (`Omnitrix\Queue\Worker`) install their own SIGTERM/SIGINT handling.

## Timing

Use `Async::sleep(float $seconds)` inside coroutines. `OpenSwoole\Coroutine::sleep()`
truncates fractional seconds in OpenSwoole 26.2 and must not be used for sub-second delays.

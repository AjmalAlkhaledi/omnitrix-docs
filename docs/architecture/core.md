# The engine (Omnitrix\Core)

The engine is the lower layer of the `omnitrix/core` package (namespace `Omnitrix\Core\`, in
`src/Core`). It owns everything that touches OpenSwoole directly: the server lifecycle, workers,
request contexts, the HTTP transport, concurrency primitives, connection pools and the drivers
built on them. It contains no routing, middleware or application conventions; those live in the
framework layer (`Omnitrix\`), which is its only intended consumer. The engine never uses the
framework layer.

## Runtime model

```
                 ┌──────────────────────────── master / manager ───────────────────────────┐
  TCP :8080 ───▶ │  OpenSwoole\Http\Server (POOL_MODE default, SIMPLE_MODE configurable)    │
                 │                                                                          │
                 │  ┌───────── HTTP worker 1..N (one process, one event loop each) ───────┐ │
                 │  │ WorkerContext (built in WorkerStart)                                 │ │
                 │  │   ├─ Container: worker-scoped services                               │ │
                 │  │   ├─ ResourceRegistry: ordered release in WorkerStop                 │ │
                 │  │   └─ Pools: database, Redis, HTTP client connections (bounded)       │ │
                 │  │                                                                      │ │
                 │  │  request → coroutine per request (RequestEntrypoint)                 │ │
                 │  │     RequestContext (coroutine-local) ─┬─ child coroutines            │ │
                 │  │     acquire → use → release resources ┘  inherit context explicitly │ │
                 │  └──────────────────────────────────────────────────────────────────────┘ │
                 │  ┌───────── CPU processes (addProcess, unix-socket IPC) ────────────────┐ │
                 │  │ isolated processes for CPU-bound jobs; supervised by the manager     │ │
                 └──┴──────────────────────────────────────────────────────────────────────┴─┘
                    queue consumers run as separate standalone coroutine processes
```

- **Process model**: POOL mode by default because it is the mode whose SIGTERM shutdown drains
  in-flight, coroutine-suspended requests; SIMPLE mode is opt-in ([platform-notes.md](platform-notes.md)).
- **One runtime**: OpenSwoole owns the event loop, coroutine scheduler, timers and signals; no
  other event loop is mixed in ([ADR-001](adr/runtime-selection.md)).
- **Hooks**: `OpenSwoole\Runtime::enableCoroutine(HOOK_ALL)` is applied at worker start so PDO
  (mysqlnd), phpredis, streams, sleep and file functions become cooperative. Outbound HTTP uses
  OpenSwoole's native coroutine clients ([ADR-002](adr/async-io-strategy.md)).
- **Reactor**: epoll by default; io_uring is opt-in and refused on kernels below 5.1, where
  OpenSwoole aborts instead of falling back.

## Lifetimes and scopes

| Scope | Created | Destroyed | Examples |
|---|---|---|---|
| Process (master) | `ServerRuntime::create()` | process exit | configuration, shared `Table`s (metrics, CPU load board) |
| Worker | `WorkerStart` | `WorkerStop` | container, pools, logger |
| Request | request coroutine start | response sent + deferred callbacks | `RequestContext`, leased connections |
| Child coroutine | `Async` / `TaskScope` spawn | task completion | inherits the parent `RequestContext` |
| Resource | pool `create` | pool `destroy` | database, Redis and HTTP connections |

Rules enforced by code and tests:

- No static mutable state carries request data. `ContextStorage` resolves the current
  coroutine's `RequestContext`, walking parent coroutines while they are alive.
- Child coroutines never outlive the scope that started them: `TaskScope` cancels and joins
  every child before it closes.
- Pooled connections are owned by one coroutine at a time; use from another coroutine throws
  `OwnershipViolationException` before the runtime's fatal "socket bound to another coroutine"
  path can be reached.
- `WorkerStop` runs outside a coroutine, so pools track their live connections in plain arrays
  and close them without channel operations.

## Modules

| Namespace | Responsibility |
|---|---|
| `Runtime\Config` | `RuntimeConfig` (validated `server` section), `ServerMode`, `InvalidConfigurationException` |
| `Runtime\Lifecycle` | `ServerRuntime`: builds the OpenSwoole server, registers lifecycle events, runs listeners |
| `Runtime\Worker` | `WorkerContext`, `WorkerLifecycle`, `WorkerRole` |
| `Runtime\Server` | `ServerFactory`, `RequestEntrypoint` (context binding, failure containment) |
| `Runtime\Context` | `RequestContext`, `ContextStorage` |
| `Runtime\Coroutine`, `Runtime\Scheduler` | `Sleep`, `Coroutines::spawn`, `Timers`, `BoundedScheduler` |
| `Runtime\Shutdown`, `Runtime\Exception` | `ResourceRegistry`, `SignalHandler`, `ErrorHandler`, exception handlers |
| `Http`, `Http\Server` | `Status`, `HttpErrorInterface`, transport adapter, `IncomingRequest`, `ResponseWriter` |
| `Concurrency` | `Async`, `TaskScope`, `Task`, `Outcome`, `CancellationToken`, `Semaphore` |
| `Pool` | generic bounded `ClientPool` |
| `Database` | configuration, PDO/mysqlnd driver, connection pool, query builder, transactions, error classification |
| `HttpClient` | `HttpClient`, `PendingRequest`, `Response`, coroutine transport, typed errors |
| `Redis`, `Cache` | pooled `RedisClient`, JSON `Cache` |
| `Queue` | `RedisQueue`, `QueueProducer`, `QueueConsumer`, `Job` |
| `Process` | CPU pool: `CpuPool`, `CpuWorker`, `CpuLoadBoard`, framing |
| `IO` | TCP/UDP sockets, DNS, filesystem, temp files |
| `Observability` | `MetricsRegistry` (shared-memory counters and histograms) |
| `Log`, `Container`, `Support` | `JsonLogger` (PSR-3), PSR-11 `Container`, platform checks and ids |

## Boundary with the framework layer

The framework layer consumes the engine through its public classes and two seams designed for it:

- **`Http\HttpErrorInterface`**: the transport renders any throwable implementing it as a JSON
  error with its status, headers and details. The framework's `HttpException` implements it;
  Core's own transport rejections (`RequestRejectedException`: malformed body, payload too
  large) do too. Core therefore never needs to know framework exception classes.
- **Handlers as callables**: `ServerRuntime::handle()` accepts any callable taking
  `(OpenSwoole\Http\Request, OpenSwoole\Http\Response, RequestContext)`; the framework passes an
  `HttpServerAdapter` wrapping its kernel.

Classes marked `@internal` are implementation details even when they are `public` in PHP.

## Request path

```
accept → parse (OpenSwoole) → RequestEntrypoint: RequestContext bound, failures → 500, deferred cleanup
      → HttpServerAdapter: body limit, request timeout, request id header
      → application handler (IncomingRequest, ResponseWriter, RequestContext)
      → ResponseWriter: buffered status/headers, streamed body, HEAD handling
      → context disposal: deferred callbacks (LIFO), binding removed
```

## Concurrency

`TaskScope` spawns coroutines through `Coroutines::spawn`, which binds the spawner's
`RequestContext` and contains uncaught exceptions (an uncaught exception in a raw OpenSwoole
coroutine is fatal for the worker). Completion is signalled over channels; `Async::all`,
`allSettled`, `race` and `withTimeout` are built on a scope. Cancellation is cooperative:
cancelling a token interrupts coroutines suspended in cancellable operations
(`Coroutine::cancel`) and runs callbacks; CPU-bound code observes the token at its next check.

## Database

PDO with mysqlnd under hooks, native prepared statements, a statement cache per connection
(LRU, 64 entries) and a framework-owned pool ([ADR-003](adr/database-driver-strategy.md)).
Statement time limits are enforced server-side (`max_statement_time` / `max_execution_time`)
because `PDO::ATTR_TIMEOUT` does not bound reads under hooks. Errors are classified by SQLSTATE
and driver code into typed exceptions. Connections that saw a connection-class error, an
interruption or an unfinished transaction are destroyed instead of reused.

## HTTP client, Redis, queue, CPU

- **HTTP client**: `OpenSwoole\Coroutine\Http\Client` (HTTP/1.1) and `Http2\Client` with
  per-origin bounded pools, explicit TLS verification and SNI, redirect policy, retries for
  idempotent requests only, and typed errors mapped from OpenSwoole error codes.
- **Redis**: phpredis under hooks, pooled; error replies (returned as `false` by phpredis) are
  converted into `CommandException`; pub/sub uses dedicated connections.
- **Queue**: reliable Redis queue (`BLMOVE` into per-consumer processing lists, heartbeats,
  delayed sorted set promoted by Lua, retries with backoff, dead letters).
- **CPU pool**: processes added with `Server::addProcess` (processes cannot be forked inside a
  coroutine), length-prefixed JSON frames over unix sockets, a shared-memory load board for
  least-loaded dispatch, kill-and-restart on timeout.

## Repository layout

```
src/              Omnitrix\        framework layer
src/Core/         Omnitrix\Core\  engine
tests/Framework/  framework tests: Unit/, Integration/, Fixtures/, Support/
tests/Core/       engine tests: Unit/, Integration/, Fixtures/ (servers started by integration tests), Support/
bin/              omnitrix-phpunit (coroutine PHPUnit runner), services (local MariaDB/Redis for tests)
benchmarks/       benchmark harness
tools/            API reference generator, router micro-benchmark
```

Documentation for every package is published on this site.

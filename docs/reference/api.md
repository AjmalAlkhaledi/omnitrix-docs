---
title: API reference
---

# API reference (omnitrix/core)

Public classes and methods, generated from the source. Classes and methods marked `@internal` are implementation details and are not listed.

## Omnitrix

### Application (class)

The developer-facing application: configuration, routes, middleware, run.

- `static create(array $config, ?Psr\Log\LoggerInterface $logger = NULL, ?Omnitrix\Core\Runtime\Exception\ExceptionHandlerInterface $exceptionHandler = NULL): Omnitrix\Application`
- `get(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `post(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `put(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `patch(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `delete(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `options(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `any(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `map(array $methods, string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `group(string $prefix, callable $define, array $middleware = …): Omnitrix\Application`
- `routes(string $file): Omnitrix\Application` — Loads a route file. The file receives `$app` (this application) and `$router` in scope,
- `middleware(Omnitrix\Http\Middleware\MiddlewareInterface|callable ...$middleware): Omnitrix\Application` — Global middleware applied to every route, in order.
- `router(): Omnitrix\Routing\Router`
- `logger(): Psr\Log\LoggerInterface` — The application logger (PSR-3). Structured JSON on stderr unless one was passed to create().
- `exceptionHandler(): Omnitrix\Core\Runtime\Exception\ExceptionHandlerInterface` — Receives every exception caught at a coroutine or request boundary.
- `config(): array`
- `isDebug(): bool`
- `onWorkerStart(callable $listener): Omnitrix\Application`
- `onWorkerStop(callable $listener): Omnitrix\Application`
- `configureContainer(callable $configurator): Omnitrix\Application`
- `build(): OpenSwoole\Http\Server` — Builds the server without starting it.
- `run(): void` — Starts the server (blocking).
- `stop(): void`
- `enableMetrics(string $path = '/metrics', array $middleware = …): Omnitrix\Application` — Records request counts and latency histograms (shared across workers) and serves them in
- `health(string $prefix = '/health', array $checks = …, float $timeout = 2.0): Omnitrix\Application` — Registers `{$prefix}/live` (process is up) and `{$prefix}/ready` (dependencies answer).
- `cpu(array $jobs, int $workers = 2, float $timeout = 30.0, int $maxPending = 64): Omnitrix\Application` — Enables the CPU worker pool: `$workers` dedicated processes, supervised and restarted by
- `withServices(callable $body): mixed` — Runs `$body` with the application's services (database, Redis, cache, queue producer,

## Omnitrix\Config

### Config (class)

Loads a configuration directory: every `*.php` file returns an array and becomes the section

- `static load(string $directory): array`
- `static get(array $config, string $path, mixed $default = NULL): mixed` — Reads a dotted path (`queue.jobs`) from a configuration array.
- `static string(array $config, string $path, string $default): string`

### Env (class)

Environment variables for configuration. Read once at boot (in the master) to build the

- `static load(string $path): int` — Loads a .env file into the process environment without overriding existing variables.
- `static get(string $name, ?string $default = NULL): ?string`
- `static required(string $name): string`
- `static int(string $name, int $default): int`
- `static bool(string $name, bool $default): bool`

## Omnitrix\Console

### Command (abstract class)

Base class for project commands. Gives access to the project ({@see Console::path()}) and to

- `__construct(?Omnitrix\Console\Console $console = NULL)`

## Omnitrix\Console\Commands

### AboutCommand (class)


### MakeCommand (abstract class)

Base class for the generators. Class names may contain sub-namespaces with `/` or `\`


### MakeControllerCommand (class)


### MakeJobCommand (class)


### MakeMiddlewareCommand (class)


### MakeMigrationCommand (class)


### MakeModelCommand (class)


### MakeSeederCommand (class)


### MigrateCommand (class)


### MigrateFreshCommand (class)


### MigrateResetCommand (class)


### MigrateRollbackCommand (class)


### MigrateStatusCommand (class)


### MigrationCommand (abstract class)

Shared plumbing for the migration and seeding commands.


### QueueWorkCommand (class)

Processes background jobs. Job names map to handlers in `config/queue.php`:


### RoutesCommand (class)


### SeedCommand (class)


### ServeCommand (class)

Starts the HTTP server in the foreground. `--host`, `--port` and `--workers` set the


## Omnitrix\Console

### Console (class)

The project command line (`php omnitrix`). A project is a directory with a `bootstrap.php`

- `__construct(string $basePath)`
- `run(?Symfony\Component\Console\Input\InputInterface $input = NULL, ?Symfony\Component\Console\Output\OutputInterface $output = NULL): int` — Runs the command line and returns the exit code.
- `add(Omnitrix\Console\Command $command): Omnitrix\Console\Console` — Adds a project command (a subclass of {@see Command}).
- `application(): Symfony\Component\Console\Application`
- `app(): Omnitrix\Application` — The project's application, built by `bootstrap.php` on first use.
- `path(string ...$segments): string`
- `static version(): string`

## Omnitrix\Core\Cache

### Cache (class)

Application cache over a key-value store.

- `__construct(Omnitrix\Core\Cache\KeyValueStoreInterface $store, string $prefix = 'cache:', int $defaultTtl = 3600)`
- `get(string $key, mixed $default = NULL): mixed`
- `set(string $key, mixed $value, ?int $ttl = NULL): bool`
- `add(string $key, mixed $value, ?int $ttl = NULL): bool` — Stores only when the key is absent (atomic).
- `forever(string $key, mixed $value): bool`
- `has(string $key): bool`
- `delete(string ...$keys): int`
- `getMany(array $keys): array`
- `remember(string $key, ?int $ttl, callable $compute): mixed` — Returns the cached value or computes, stores and returns it.
- `increment(string $key, int $by = 1): int`
- `decrement(string $key, int $by = 1): int`
- `ttl(string $key): int`
- `key(string $key): string`

### KeyValueStoreInterface (interface)

Minimal string store the cache is built on (Redis in production, in-memory in tests).

- `get(string $key): ?string`
- `set(string $key, string $value, ?int $ttl = NULL): bool`
- `setIfAbsent(string $key, string $value, ?int $ttl = NULL): bool`
- `getMany(array $keys): array`
- `delete(string ...$keys): int`
- `exists(string $key): bool`
- `increment(string $key, int $by = 1): int`
- `decrement(string $key, int $by = 1): int`
- `expire(string $key, int $seconds): bool`
- `ttl(string $key): int`

## Omnitrix\Core\Concurrency

### Async (class)

Structured concurrency combinators over {@see TaskScope}.

- `static all(array $tasks, ?float $timeout = NULL, ?int $concurrency = NULL, ?Omnitrix\Core\Concurrency\CancellationToken $parent = NULL): array` — Runs all callables concurrently and returns their results keyed like `$tasks`.
- `static allSettled(array $tasks, ?float $timeout = NULL, ?int $concurrency = NULL, ?Omnitrix\Core\Concurrency\CancellationToken $parent = NULL): array` — Runs all callables concurrently and reports every outcome; individual failures do not
- `static race(array $tasks, ?float $timeout = NULL, ?Omnitrix\Core\Concurrency\CancellationToken $parent = NULL): mixed` — Returns the result of the first task to complete successfully and cancels the rest.
- `static withTimeout(callable $body, float $timeout, ?Omnitrix\Core\Concurrency\CancellationToken $parent = NULL): mixed` — Runs `$body` in a child task bounded by `$timeout` seconds; on expiry the task is
- `static scope(callable $body, ?int $concurrency = NULL, ?Omnitrix\Core\Concurrency\CancellationToken $parent = NULL): mixed` — Runs `$body` with a scope that is closed (remaining tasks cancelled and awaited) when
- `static sleep(float $seconds): void` — Cooperative, cancellable sleep.

### CancellationToken (class)

Cooperative cancellation signal.

- `static none(): Omnitrix\Core\Concurrency\CancellationToken`
- `isCancelled(): bool`
- `reason(): ?string`
- `throwIfCancelled(): void`
- `onCancel(callable $callback): void` — Registers a callback; runs immediately if already cancelled. @param callable(string|null): void $callback
- `attach(int $cid): void` — Attaches a coroutine that will be interrupted on cancel.
- `detach(int $cid): void`
- `createChild(): Omnitrix\Core\Concurrency\CancellationToken` — A token that is cancelled when this one is (but not the other way round).
- `cancel(?string $reason = NULL): void` — Idempotent.

### CancelledException (class)

The operation was cancelled through its {@see CancellationToken}.


### Outcome (class)

Result of one task in {@see Async::allSettled()}: fulfilled with a value or rejected with a throwable.

- `static fulfilled(mixed $value): Omnitrix\Core\Concurrency\Outcome`
- `static rejected(Throwable $reason, bool $cancelled = false): Omnitrix\Core\Concurrency\Outcome`
- `isRejected(): bool`
- `get(): mixed` — The value, or throws the rejection reason.

### Semaphore (class)

Counting semaphore for bounding concurrency across coroutines (permits are channel tokens).

- `__construct(int $limit)`
- `acquire(?float $timeout = NULL, ?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): void` — Waits for a permit. Throws {@see TimeoutException} after `$timeout` seconds or
- `release(): void`
- `withPermit(callable $fn, ?float $timeout = NULL, ?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): mixed` — Runs `$fn` while holding a permit.
- `available(): int`
- `inUse(): int`
- `peak(): int`

### Task (class)

A unit of concurrent work running in its own coroutine, owned by a {@see TaskScope}.

- `static start(string|int $key, callable $body, Omnitrix\Core\Concurrency\CancellationToken $parentToken, ?Omnitrix\Core\Concurrency\Semaphore $semaphore = NULL, ?callable $onSettle = NULL): Omnitrix\Core\Concurrency\Task` — Starts the task immediately (the coroutine is created now; it runs until its first
- `state(): Omnitrix\Core\Concurrency\TaskState`
- `isDone(): bool`
- `token(): Omnitrix\Core\Concurrency\CancellationToken`
- `coroutineId(): int`
- `cancel(?string $reason = NULL): void` — Requests cancellation; the task settles as Cancelled once its coroutine unwinds.
- `await(?float $timeout = NULL): mixed` — Waits for completion and returns the result; rethrows the task's failure, throws
- `join(?float $timeout = NULL): bool` — Waits for the task to settle without throwing its failure. Returns false on timeout.
- `result(): mixed`
- `failure(): ?Throwable`

### TaskScope (class)

Structured concurrency scope: every task spawned here is joined or cancelled before the

- `__construct(?Omnitrix\Core\Concurrency\CancellationToken $parent = NULL, ?int $concurrency = NULL)`
- `token(): Omnitrix\Core\Concurrency\CancellationToken`
- `spawn(callable $body, string|int|null $key = NULL): Omnitrix\Core\Concurrency\Task` — Starts a task. `$body` receives the scope's cancellation token.
- `nextSettled(?float $timeout = NULL): ?Omnitrix\Core\Concurrency\Task` — Returns the next task to settle (completion order), or null when every spawned task
- `tasks(): array`
- `count(): int`
- `cancel(?string $reason = NULL): void` — Cancels every task (idempotent).
- `join(?float $timeout = NULL): bool` — Waits for all tasks to settle (success, failure or cancellation). Returns false if the
- `close(float $graceSeconds = 5.0): int` — Closes the scope: cancels unfinished tasks and waits for them to unwind. After this no
- `running(): array` — Coroutine ids of tasks that are still running (diagnostics).

### TaskState (enum)

- `static cases(): array`
- `static from(string|int $value): static`
- `static tryFrom(string|int $value): ?static`

### TimeoutException (class)

A deadline passed before the awaited work completed.


## Omnitrix\Core\Container

### Container (class)

Small explicit PSR-11 container (no autowiring, no reflection).

- `bind(string $id, callable $factory): void` — Registers a factory that produces a new instance on every `get()`.
- `singleton(string $id, callable $factory): void` — Registers a factory whose first result is cached for the container's lifetime.
- `instance(string $id, mixed $instance): void` — Registers an existing instance.
- `has(string $id): bool`
- `get(string $id): mixed`
- `getTyped(string $id, string $class): object` — Typed accessor: resolves `$id` and asserts the instance is a `$class`.
- `ids(): array`

### ContainerException (class)


### NotFoundException (class)


## Omnitrix\Core\Database\Config

### DatabaseConfig (class)

Validated settings of one named database connection (the `database` config section).

- `static fromArray(array $config, string $name = 'default'): Omnitrix\Core\Database\Config\DatabaseConfig`

### PoolConfig (class)

Pool sizing and lifecycle limits (seconds; 0 disables a timeout).

- `__construct(int $min, int $max, float $acquireTimeout, float $idleTimeout, float $maxLifetime, float $validationInterval, float $evictionInterval)`

## Omnitrix\Core\Database\Connection

### PdoConnection (class)

{@see ConnectionInterface} over PDO + mysqlnd. Under OpenSwoole runtime hooks every network

- `__construct(?PDO $pdo, string $id, $applyStatementTimeout, int $statementCacheSize = 64)`
- `id(): string`
- `select(string $sql, array $bindings = …): array`
- `execute(string $sql, array $bindings = …): int`
- `insert(string $sql, array $bindings = …): int`
- `beginTransaction(): void`
- `commit(): void`
- `rollBack(): void`
- `inTransaction(): bool`
- `setStatementTimeout(float $seconds): void`
- `ping(): bool`
- `isBroken(): bool`
- `markBroken(): void`
- `createdAt(): float`
- `lastUsedAt(): float`
- `touch(): void`
- `close(): void`
- `cachedStatements(): int` — Number of cached prepared statements (diagnostics).

## Omnitrix\Core\Database\Contracts

### ConnectionInterface (interface)

One physical database connection. Not coroutine-safe: a connection is used by exactly one

- `id(): string` — Stable identifier for logs and pool bookkeeping.
- `select(string $sql, array $bindings = …): array` — Runs a statement that returns rows.
- `execute(string $sql, array $bindings = …): int` — Runs a statement without a result set; returns the affected row count.
- `insert(string $sql, array $bindings = …): int` — Runs an INSERT and returns the generated id (0 when none).
- `beginTransaction(): void`
- `commit(): void`
- `rollBack(): void`
- `inTransaction(): bool`
- `setStatementTimeout(float $seconds): void` — Server-side statement time limit for subsequent statements (seconds, 0 = unlimited).
- `ping(): bool` — Cheap liveness check (SELECT 1); false when the connection is unusable.
- `isBroken(): bool` — True once the connection must not be reused (lost, interrupted, in unknown state).
- `markBroken(): void`
- `createdAt(): float`
- `lastUsedAt(): float`
- `touch(): void`
- `close(): void`

### DriverInterface (interface)

Creates physical connections for one database technology.

- `name(): string`
- `connect(Omnitrix\Core\Database\Config\DatabaseConfig $config): Omnitrix\Core\Database\Contracts\ConnectionInterface`
- `grammar(): Omnitrix\Core\Database\Contracts\GrammarInterface`

### GrammarInterface (interface)

SQL dialect specifics used by the query builder.

- `wrap(string $identifier): string` — Quotes an identifier such as `users` or `u.name` (`*` is passed through).
- `wrapTable(string $table): string` — Quotes a table name, optionally with an alias ("users as u").
- `parameter(): string` — Placeholder for one bound value.
- `compileLimitOffset(?int $limit, ?int $offset): string`
- `supportsReturning(): bool`

## Omnitrix\Core\Database

### Database (class)

One named database: its pool, grammar and transaction manager. Worker-scoped.

- `__construct(Omnitrix\Core\Database\Config\DatabaseConfig $config, Omnitrix\Core\Database\Contracts\DriverInterface $driver, ?Psr\Log\LoggerInterface $logger = NULL)`
- `warmUp(): void`
- `pool(): Omnitrix\Core\Database\Pool\ConnectionPool`
- `stats(): Omnitrix\Core\Database\Pool\PoolStats`
- `table(string $table): Omnitrix\Core\Database\Query\Builder`
- `query(): Omnitrix\Core\Database\Query\Builder`
- `select(string $sql, array $bindings = …): array`
- `selectOne(string $sql, array $bindings = …): ?array`
- `execute(string $sql, array $bindings = …): int`
- `insert(string $sql, array $bindings = …): int`
- `transaction(callable $callback, int $attempts = 1): mixed`
- `acquire(?float $timeout = NULL): Omnitrix\Core\Database\Pool\PooledConnection` — Leases a connection to the caller for several statements (e.g. a cursor); the caller
- `close(float $drainTimeout = 10.0): int` — Graceful shutdown of the pool.

### DatabaseManager (class)

Registry of named databases for one worker. Built from the `database` config section, which

- `__construct(array $section, ?Psr\Log\LoggerInterface $logger = NULL)`
- `registerDriver(string $name, Omnitrix\Core\Database\Contracts\DriverInterface $driver): void`
- `connection(?string $name = NULL): Omnitrix\Core\Database\Database`
- `table(string $table, ?string $connection = NULL): Omnitrix\Core\Database\Query\Builder`
- `names(): array`
- `warmUp(): void` — Opens the configured minimum connections of every database.
- `close(float $drainTimeout = 10.0): int` — Drains and closes every pool. @return int leased connections that did not return in time

## Omnitrix\Core\Database\Driver\MySQL

### MySqlDriver (class)

MySQL / MariaDB driver on pdo_mysql (mysqlnd).

- `__construct()`
- `name(): string`
- `grammar(): Omnitrix\Core\Database\Contracts\GrammarInterface`
- `connect(Omnitrix\Core\Database\Config\DatabaseConfig $config): Omnitrix\Core\Database\Contracts\ConnectionInterface`

### MySqlGrammar (class)

MySQL/MariaDB identifier quoting and dialect fragments.

- `wrap(string $identifier): string`
- `wrapTable(string $table): string`
- `parameter(): string`
- `compileLimitOffset(?int $limit, ?int $offset): string`
- `supportsReturning(): bool`

## Omnitrix\Core\Database\Exception

### ConnectionException (class)

The connection could not be established or was lost. The pool discards the connection and


### ConstraintViolationException (class)

Integrity constraint violation.


### DatabaseException (class)

Base class of every database error raised by Omnitrix.


### DeadlockException (class)

Deadlock detected; the transaction was rolled back and may be retried.


### ErrorClassifier (class)

Maps PDO/MySQL errors to the framework exception hierarchy so callers (and the pool) can

- `static classify(PDOException $e, string $sql = '', array $bindings = …): Omnitrix\Core\Database\Exception\DatabaseException`
- `static isConnectionError(?string $sqlState, int $driverCode, string $message): bool`

### LockWaitTimeoutException (class)

Lock wait timeout exceeded.


### OwnershipViolationException (class)

A pooled connection was used from a coroutine that does not own it, or after release.


### PoolExhaustedException (class)

No connection became available within the acquisition timeout (backpressure signal).


### QueryException (class)

A statement failed. Carries the SQL (truncated) and SQLSTATE; bindings are never included.

- `__construct(string $message, string $sql, ?string $sqlState, int $driverCode, int $bindingCount, ?Throwable $previous = NULL)`
- `sql(): string`
- `sqlState(): ?string`
- `driverCode(): int`
- `bindingCount(): int`
- `static describe(string $sql, array $bindings): string`

### QueryTimeoutException (class)

Statement exceeded its time limit.


### TransactionException (class)

Transaction control failed or was misused (commit without begin, nested misuse…).


### UniqueConstraintViolationException (class)

Duplicate entry violates a unique constraint.


## Omnitrix\Core\Database\Pool

### ConnectionPool (class)

Bounded pool of physical connections for one worker process.

- `__construct(string $name, Omnitrix\Core\Database\Config\PoolConfig $config, Closure $factory, ?Closure $log = NULL)`
- `warmUp(): void` — Opens `min` connections eagerly and starts the eviction timer (call from the worker).
- `acquire(?float $timeout = NULL, ?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): Omnitrix\Core\Database\Pool\PooledConnection` — Leases a connection to the current coroutine.
- `withConnection(callable $fn, ?float $timeout = NULL, ?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): mixed` — Runs `$fn` with a leased connection and releases it afterwards (also on exceptions).
- `stats(): Omnitrix\Core\Database\Pool\PoolStats`
- `isClosed(): bool`
- `evict(): int` — Evicts idle connections past idle_timeout / max_lifetime, keeping `min`.
- `close(float $drainTimeout = 10.0): int` — Graceful shutdown: refuses new leases, waits up to `$drainTimeout` for leased

### PoolStats (class)

Snapshot of pool state for metrics and tests.

- `__construct(int $size, int $idle, int $inUse, int $waiting, int $created, int $destroyed, int $acquired, int $timeouts, int $validationFailures, float $totalWaitSeconds, float $maxWaitSeconds)`
- `toArray(): array`

### PooledConnection (class)

A connection checked out of the pool, bound to the coroutine that acquired it.

- `__construct(Omnitrix\Core\Database\Contracts\ConnectionInterface $inner, Omnitrix\Core\Database\Pool\ConnectionPool $pool, int $ownerCid)`
- `ownerCid(): int`
- `isReleased(): bool`
- `release(): void` — Returns the connection to the pool (or discards it when broken / mid-transaction).
- `inner(): Omnitrix\Core\Database\Contracts\ConnectionInterface` — The underlying physical connection (for diagnostics; do not retain).
- `id(): string`
- `select(string $sql, array $bindings = …): array`
- `execute(string $sql, array $bindings = …): int`
- `insert(string $sql, array $bindings = …): int`
- `beginTransaction(): void`
- `commit(): void`
- `rollBack(): void`
- `inTransaction(): bool`
- `setStatementTimeout(float $seconds): void`
- `ping(): bool`
- `isBroken(): bool`
- `markBroken(): void`
- `createdAt(): float`
- `lastUsedAt(): float`
- `touch(): void`
- `close(): void` — Closing a leased connection discards it from the pool.

## Omnitrix\Core\Database\Query

### Builder (class)

Fluent SQL builder with positional bindings. No hydration, no model layer: results are plain

- `__construct(Omnitrix\Core\Database\Contracts\GrammarInterface $grammar, Omnitrix\Core\Database\Query\QueryExecutorInterface $executor, ?string $table = NULL)`
- `static raw(string $sql, array $bindings = …): Omnitrix\Core\Database\Query\Expression`
- `from(string $table): Omnitrix\Core\Database\Query\Builder`
- `select(Omnitrix\Core\Database\Query\Expression|string ...$columns): Omnitrix\Core\Database\Query\Builder`
- `addSelect(Omnitrix\Core\Database\Query\Expression|string ...$columns): Omnitrix\Core\Database\Query\Builder`
- `distinct(): Omnitrix\Core\Database\Query\Builder`
- `join(string $table, string $first, string $operator, string $second, string $type = 'inner'): Omnitrix\Core\Database\Query\Builder`
- `leftJoin(string $table, string $first, string $operator, string $second): Omnitrix\Core\Database\Query\Builder`
- `rightJoin(string $table, string $first, string $operator, string $second): Omnitrix\Core\Database\Query\Builder`
- `where(Omnitrix\Core\Database\Query\Expression|Closure|array|string $column, mixed $operator = NULL, mixed $value = NULL, string $boolean = 'and'): Omnitrix\Core\Database\Query\Builder` — `where('id', 10)`, `where('age', '>=', 18)`, `where(fn (Builder $q) => $q->where(...)->orWhere(...))`,
- `orWhere(Omnitrix\Core\Database\Query\Expression|Closure|array|string $column, mixed $operator = NULL, mixed $value = NULL): Omnitrix\Core\Database\Query\Builder`
- `whereIn(string $column, array $values, string $boolean = 'and', bool $not = false): Omnitrix\Core\Database\Query\Builder`
- `whereNotIn(string $column, array $values, string $boolean = 'and'): Omnitrix\Core\Database\Query\Builder`
- `whereNull(string $column, string $boolean = 'and', bool $not = false): Omnitrix\Core\Database\Query\Builder`
- `whereNotNull(string $column, string $boolean = 'and'): Omnitrix\Core\Database\Query\Builder`
- `whereBetween(string $column, mixed $from, mixed $to, string $boolean = 'and', bool $not = false): Omnitrix\Core\Database\Query\Builder`
- `whereColumn(string $first, string $operator, string $second, string $boolean = 'and'): Omnitrix\Core\Database\Query\Builder`
- `whereRaw(string $sql, array $bindings = …, string $boolean = 'and'): Omnitrix\Core\Database\Query\Builder`
- `groupBy(string ...$columns): Omnitrix\Core\Database\Query\Builder`
- `having(Omnitrix\Core\Database\Query\Expression|string $column, string $operator, mixed $value, string $boolean = 'and'): Omnitrix\Core\Database\Query\Builder`
- `orderBy(Omnitrix\Core\Database\Query\Expression|string $column, string $direction = 'asc'): Omnitrix\Core\Database\Query\Builder`
- `orderByDesc(string $column): Omnitrix\Core\Database\Query\Builder`
- `limit(int $limit): Omnitrix\Core\Database\Query\Builder`
- `offset(int $offset): Omnitrix\Core\Database\Query\Builder`
- `lockForUpdate(): Omnitrix\Core\Database\Query\Builder`
- `toSql(): string`
- `getBindings(): array`
- `get(): array`
- `first(): ?array`
- `find(string|int $id, string $column = 'id'): ?array`
- `value(string $column): mixed`
- `pluck(string $column): array`
- `count(string $column = '*'): int`
- `exists(): bool`
- `sum(string $column): int|float`
- `max(string $column): mixed`
- `min(string $column): mixed`
- `avg(string $column): ?float`
- `insert(array $values): int`
- `insertGetId(array $values): int`
- `update(array $values): int`
- `increment(string $column, int|float $amount = 1, array $extra = …): int`
- `decrement(string $column, int|float $amount = 1, array $extra = …): int`
- `delete(): int`

### Expression (class)

A raw SQL fragment the builder inserts verbatim. Only ever build one from trusted,

- `__construct(string $sql, array $bindings = …)`

### QueryExecutorInterface (interface)

What the {@see Builder} needs to run compiled SQL (implemented by the connection manager).

- `select(string $sql, array $bindings = …): array`
- `execute(string $sql, array $bindings = …): int`
- `insert(string $sql, array $bindings = …): int`

### WhereClause (class)

One compiled-later WHERE condition.

- `__construct(string $type, string $boolean = 'and', string $column = '', string $operator = '', bool $not = false, int $count = 0, string $sql = '', ?Omnitrix\Core\Database\Query\Builder $nested = NULL, string $first = '', string $second = '')`

## Omnitrix\Core\Database\Transaction

### TransactionManager (class)

Transactions with exclusive connection ownership.

- `__construct(string $connectionName)`
- `transaction(Omnitrix\Core\Database\Pool\ConnectionPool $pool, callable $callback, int $attempts = 1, ?float $acquireTimeout = NULL): mixed`
- `pinned(): ?Omnitrix\Core\Database\Pool\PooledConnection` — The connection pinned by an enclosing transaction in the *current coroutine*, if any.

## Omnitrix\Core\HttpClient\Exception

### ConnectionException (class)

Could not connect, or the connection was reset/closed before a response arrived (refused, reset, server closed).


### DnsException (class)

Hostname could not be resolved.


### HttpClientException (class)

Base class of every outbound HTTP failure.


### RequestException (class)

A 4xx/5xx response, raised by {@see Response::throw()}; the response is attached.

- `__construct(Omnitrix\Core\HttpClient\Response $response)`

### ResponseTooLargeException (class)

The response body exceeded max_response_size.


### TimeoutException (class)

Connect or response timeout elapsed.


### TlsException (class)

TLS handshake or certificate verification failed.


### TooManyRedirectsException (class)

The redirect chain exceeded max_redirects.


## Omnitrix\Core\HttpClient

### HttpClient (class)

Outbound HTTP client: pooled connections, strict TLS, timeouts, redirect policy, bounded

- `__construct(Omnitrix\Core\HttpClient\HttpClientConfig $config, ?Omnitrix\Core\HttpClient\Transport\TransportInterface $transport = NULL)`
- `request(): Omnitrix\Core\HttpClient\PendingRequest`
- `get(string $url, array $query = …): Omnitrix\Core\HttpClient\Response`
- `post(string $url, ?array $json = NULL): Omnitrix\Core\HttpClient\Response`
- `send(string $method, Omnitrix\Core\HttpClient\Uri $uri, array $headers, string $body, Omnitrix\Core\HttpClient\RequestOptions $options, ?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): Omnitrix\Core\HttpClient\Response` — Executes a prepared request: redirects, retries, size limit and in-flight cap.
- `stats(): array`
- `close(): void`

### HttpClientConfig (class)

Validated `http_client` configuration section (defaults for every outbound request).

- `static fromArray(array $config): Omnitrix\Core\HttpClient\HttpClientConfig`
- `static defaults(): Omnitrix\Core\HttpClient\HttpClientConfig`

### PendingRequest (class)

Fluent request builder.

- `__construct(Omnitrix\Core\HttpClient\HttpClient $client)`
- `withHeaders(array $headers): Omnitrix\Core\HttpClient\PendingRequest`
- `withHeader(string $name, string $value): Omnitrix\Core\HttpClient\PendingRequest`
- `withToken(string $token, string $type = 'Bearer'): Omnitrix\Core\HttpClient\PendingRequest`
- `withBasicAuth(string $username, string $password): Omnitrix\Core\HttpClient\PendingRequest`
- `accept(string $contentType): Omnitrix\Core\HttpClient\PendingRequest`
- `withQuery(array $query): Omnitrix\Core\HttpClient\PendingRequest`
- `asJson(mixed $data): Omnitrix\Core\HttpClient\PendingRequest` — JSON body (objects/arrays/JsonSerializable).
- `asForm(array $fields): Omnitrix\Core\HttpClient\PendingRequest` — application/x-www-form-urlencoded body.
- `withBody(string $body, string $contentType): Omnitrix\Core\HttpClient\PendingRequest` — Raw body with an explicit content type.
- `timeout(float $seconds): Omnitrix\Core\HttpClient\PendingRequest` — Response timeout in seconds (after the request was sent).
- `connectTimeout(float $seconds): Omnitrix\Core\HttpClient\PendingRequest`
- `maxRedirects(int $count): Omnitrix\Core\HttpClient\PendingRequest`
- `withoutRedirecting(): Omnitrix\Core\HttpClient\PendingRequest`
- `maxResponseSize(int $bytes): Omnitrix\Core\HttpClient\PendingRequest`
- `withCaFile(string $path): Omnitrix\Core\HttpClient\PendingRequest` — Pins a CA bundle for this request (private PKI).
- `withoutTlsVerification(): Omnitrix\Core\HttpClient\PendingRequest` — Disables certificate verification for this request only. Never use against production
- `retry(int $times, bool $onTimeout = false): Omnitrix\Core\HttpClient\PendingRequest` — Retries (idempotent methods only) on connection failures.
- `http2(bool $enabled = true): Omnitrix\Core\HttpClient\PendingRequest`
- `withCancellation(Omnitrix\Core\Concurrency\CancellationToken $token): Omnitrix\Core\HttpClient\PendingRequest`
- `get(string $url): Omnitrix\Core\HttpClient\Response`
- `head(string $url): Omnitrix\Core\HttpClient\Response`
- `post(string $url): Omnitrix\Core\HttpClient\Response`
- `put(string $url): Omnitrix\Core\HttpClient\Response`
- `patch(string $url): Omnitrix\Core\HttpClient\Response`
- `delete(string $url): Omnitrix\Core\HttpClient\Response`
- `send(string $method, string $url): Omnitrix\Core\HttpClient\Response`
- `download(string $url, string $path): Omnitrix\Core\HttpClient\Response` — Streams the response body into `$path` (not buffered; size limit does not apply).

### RequestOptions (class)

Per-request overrides of {@see HttpClientConfig} (null = use the configured default).

- `__construct(?float $timeout = NULL, ?float $connectTimeout = NULL, ?int $maxRedirects = NULL, ?int $maxResponseSize = NULL, ?bool $verifyTls = NULL, ?string $caFile = NULL, ?int $retries = NULL, ?bool $retryOnTimeout = NULL, ?bool $http2 = NULL, ?string $downloadTo = NULL)`

### Response (class)

An outbound HTTP response (fully buffered body).

- `__construct(int $status, array $headers, string $body, string $url, array $setCookies = …, int $redirects = 0, float $elapsed = 0.0, string $protocol = '1.1')`
- `status(): int`
- `ok(): bool`
- `successful(): bool`
- `redirect(): bool`
- `clientError(): bool`
- `serverError(): bool`
- `failed(): bool`
- `throw(): Omnitrix\Core\HttpClient\Response` — Throws {@see RequestException} for 4xx/5xx; returns $this otherwise.
- `header(string $name, ?string $default = NULL): ?string`
- `hasHeader(string $name): bool`
- `headers(): array`
- `setCookies(): array`
- `contentType(): ?string`
- `body(): string`
- `size(): int`
- `json(): mixed` — Decoded JSON body (objects as arrays), decoded once and cached.
- `jsonObject(): array` — JSON object body as a string-keyed array.
- `url(): string` — Final URL after redirects.
- `redirectCount(): int`
- `elapsed(): float` — Wall-clock seconds for the whole exchange including redirects and retries.
- `protocol(): string`

## Omnitrix\Core\HttpClient\Transport

### CancelledOutboundException (class)

The coroutine performing the request was cancelled (timeout group, request abort).


### Exchange (class)

One request as handed to a transport (after defaults, auth, query and body were applied).

- `__construct(string $method, Omnitrix\Core\HttpClient\Uri $uri, array $headers, string $body, float $connectTimeout, float $timeout, bool $verifyTls, ?string $caFile, bool $http2, ?string $downloadTo = NULL)`

### OpenSwooleTransport (class)

Pooled OpenSwoole coroutine HTTP transport.

- `__construct(Omnitrix\Core\HttpClient\HttpClientConfig $config)`
- `exchange(Omnitrix\Core\HttpClient\Transport\Exchange $exchange, ?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): Omnitrix\Core\HttpClient\Transport\RawResponse`
- `stats(): array`
- `close(): void`

### RawResponse (class)

What a transport returns for one exchange.

- `__construct(int $status, array $headers, string $body, array $setCookies = …, string $protocol = '1.1')`

### TransportInterface (interface)

Performs exactly one HTTP exchange. Transports throw the HttpClient exception hierarchy for

- `exchange(Omnitrix\Core\HttpClient\Transport\Exchange $exchange, ?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): Omnitrix\Core\HttpClient\Transport\RawResponse`
- `stats(): array`
- `close(): void`

## Omnitrix\Core\HttpClient

### Uri (class)

Parsed absolute http(s) URL with helpers for query merging and redirect resolution.

- `static parse(string $url): Omnitrix\Core\HttpClient\Uri`
- `isTls(): bool`
- `target(): string` — Request target (path + query) as sent on the wire.
- `hostHeader(): string`
- `origin(): string` — Origin key used for connection pooling.
- `withQuery(array $params): Omnitrix\Core\HttpClient\Uri`
- `resolve(string $location): Omnitrix\Core\HttpClient\Uri` — Resolves a Location header against this URL (absolute, protocol-relative, absolute-path or relative).

## Omnitrix\Core\Http

### HttpErrorInterface (interface)

An error that maps directly to an HTTP response.

- `status(): int`
- `headers(): array`
- `details(): array`

## Omnitrix\Core\Http\Server

### HeadersAlreadySentException (class)

Status, headers or cookies were modified after the response started streaming.


### HttpServerAdapter (class)

Bridges the runtime entry point to the HTTP transport layer.

- `__construct(Omnitrix\Core\Http\Server\HttpServerConfig $config, callable $handler, Omnitrix\Core\Runtime\Exception\ExceptionHandlerInterface $exceptionHandler)`
- `__invoke(OpenSwoole\Http\Request $raw, OpenSwoole\Http\Response $rawResponse, Omnitrix\Core\Runtime\Context\RequestContext $context): void`

### HttpServerConfig (class)

Validated `http` configuration section (transport-level policies of the HTTP adapter).

- `static fromArray(array $config, int $packageMaxLength = 2097152): Omnitrix\Core\Http\Server\HttpServerConfig`
- `static defaults(): Omnitrix\Core\Http\Server\HttpServerConfig`

### IncomingRequest (class)

Transport-level view of an HTTP request parsed by OpenSwoole.

- `__construct(OpenSwoole\Http\Request $raw, int $jsonMaxDepth = 64)`
- `raw(): OpenSwoole\Http\Request`
- `method(): string` — Upper-case HTTP method.
- `isMethod(string $method): bool`
- `path(): string` — Path without query string, as sent (not decoded, not normalised).
- `queryString(): string`
- `query(): array` — Parsed query parameters (PHP array syntax supported).
- `queryParam(string $name, mixed $default = NULL): mixed`
- `protocolVersion(): string` — HTTP protocol version such as "1.1" or "2".
- `headers(): array`
- `header(string $name, ?string $default = NULL): ?string`
- `hasHeader(string $name): bool`
- `cookies(): array`
- `cookie(string $name, ?string $default = NULL): ?string`
- `contentType(): ?string` — Media type of the body without parameters, lower-case (e.g. "application/json"), or null.
- `isJson(): bool`
- `declaredContentLength(): ?int` — Declared Content-Length, or null when absent/invalid.
- `body(): string` — Raw request body (empty string when none).
- `bodyLength(): int`
- `json(): mixed` — Decoded JSON body (objects as associative arrays). Decoded once; an empty body decodes to
- `jsonObject(): array` — JSON body that must be an object (associative array).
- `form(): array` — Parsed form fields for application/x-www-form-urlencoded and multipart bodies.
- `files(): array` — Uploaded files as parsed by OpenSwoole.
- `remoteAddress(): ?string`
- `remotePort(): ?int`
- `receivedAt(): float` — Server-side receive time (float unix timestamp).
- `connectionId(): int` — OpenSwoole connection descriptor.

### OpenSwooleResponseSink (class)

{@see ResponseSinkInterface} over the live OpenSwoole response.

- `__construct(OpenSwoole\Http\Response $response)`
- `status(int $code, string $reason): void`
- `header(string $name, string $value): void`
- `cookie(string $name, string $value, int $expires, string $path, string $domain, bool $secure, bool $httpOnly, string $sameSite): void`
- `write(string $chunk): bool`
- `end(string $body): bool`
- `sendFile(string $path, int $offset, int $length): bool`

### RequestRejectedException (class)

The transport rejected a request before it reached application code (malformed body, size limit).

- `__construct(int $status, string $message, array $headers = …, array $details = …, ?Throwable $previous = NULL)`
- `static badRequest(string $message, ?Throwable $previous = NULL): Omnitrix\Core\Http\Server\RequestRejectedException`
- `static payloadTooLarge(int $limit): Omnitrix\Core\Http\Server\RequestRejectedException`
- `status(): int`
- `headers(): array`
- `details(): array`

### ResponseSinkInterface (interface)

The transport the {@see ResponseWriter} writes to. The OpenSwoole implementation wraps

- `status(int $code, string $reason): void`
- `header(string $name, string $value): void`
- `cookie(string $name, string $value, int $expires, string $path, string $domain, bool $secure, bool $httpOnly, string $sameSite): void`
- `write(string $chunk): bool` — Sends a chunk (chunked transfer encoding). Returns false when the client is gone.
- `end(string $body): bool` — Sends the final (or only) body and completes the response.
- `sendFile(string $path, int $offset, int $length): bool` — Sends a file via sendfile(2); completes the response.

### ResponseWriter (class)

Builds and sends one HTTP response.

- `__construct(Omnitrix\Core\Http\Server\ResponseSinkInterface $sink, bool $headOnly = false, int $jsonFlags = 320)`
- `status(int $code): Omnitrix\Core\Http\Server\ResponseWriter`
- `statusCode(): int`
- `header(string $name, string $value): Omnitrix\Core\Http\Server\ResponseWriter`
- `headers(array $headers): Omnitrix\Core\Http\Server\ResponseWriter`
- `removeHeader(string $name): Omnitrix\Core\Http\Server\ResponseWriter`
- `hasHeader(string $name): bool`
- `getHeader(string $name): ?string`
- `getHeaders(): array`
- `cookie(string $name, string $value, int $expires = 0, string $path = '/', string $domain = '', bool $secure = false, bool $httpOnly = true, string $sameSite = 'Lax'): Omnitrix\Core\Http\Server\ResponseWriter`
- `write(string $chunk): bool` — Streams a chunk. The first call commits status and headers.
- `end(string $body = ''): bool` — Sends the final body (or an empty body) and ends the response.
- `json(mixed $data, int $status = 200): bool` — Ends with a JSON body.
- `text(string $body, int $status = 200, string $contentType = 'text/plain; charset=utf-8'): bool`
- `noContent(): bool`
- `redirect(string $location, int $status = 302): bool`
- `sendFile(string $path, int $offset = 0, int $length = 0): bool` — Sends a file with sendfile(2). `$length` 0 means "to the end of the file".
- `isEnded(): bool`
- `headersSent(): bool`
- `clientGone(): bool` — True once the transport reported that the client disconnected.
- `bytesWritten(): int`

## Omnitrix\Core\Http

### Status (class)

HTTP status codes and reason phrases used by the framework.

- `static phrase(int $code): string`
- `static isValid(int $code): bool`
- `static isError(int $code): bool`

## Omnitrix\Core\IO

### ConnectionClosedException (class)

The peer closed the connection before the expected data arrived.


### Dns (class)

Coroutine DNS resolution (c-ares via `Coroutine\System`) with a small per-worker TTL cache.

- `__construct(float $ttl = 60.0, int $maxEntries = 1024)`
- `resolve(string $host, float $timeout = 5.0): string`
- `resolveAll(string $host, float $timeout = 5.0): array`
- `clear(): void`

### Filesystem (class)

Filesystem helpers that do not block the event loop.

- `read(string $path): string`
- `write(string $path, string $data): void` — Atomic write: data goes to a sibling temp file which is then renamed over the target.
- `append(string $path, string $data): void`
- `exists(string $path): bool`
- `delete(string $path): bool`
- `ensureDirectory(string $path, int $mode = 509): void`
- `deleteDirectory(string $path): void` — Removes a directory tree.
- `readChunks(string $path, int $chunkSize = 65536): Generator` — Streams a file in chunks without loading it into memory.
- `writeChunks(string $path, iterable $chunks): int` — Writes chunks from any iterable to `$path` (streaming copy); returns bytes written.

### IoException (class)

Base class of socket, DNS and filesystem errors.


### IoTimeoutException (class)

A socket operation did not complete within its timeout.


### TcpConnection (class)

A connected TCP stream on an OpenSwoole coroutine socket. Every wait suspends only the

- `__construct(OpenSwoole\Coroutine\Socket $socket)`
- `static connect(string $host, int $port, float $timeout = 5.0, ?Omnitrix\Core\IO\Dns $dns = NULL): Omnitrix\Core\IO\TcpConnection`
- `send(string $data, float $timeout = 5.0): void` — Sends all bytes.
- `receive(int $maxBytes = 65536, float $timeout = 5.0): string` — Up to `$maxBytes` bytes as soon as any arrive; '' when the peer closed.
- `receiveExactly(int $bytes, float $timeout = 5.0): string` — Exactly `$bytes` bytes, or an exception.
- `receiveLine(int $maxBytes = 65536, float $timeout = 5.0): string` — One line including the trailing "\n" (max `$maxBytes`); '' when the peer closed.
- `remote(): ?array`
- `close(): void`
- `isClosed(): bool`

### TcpServer (class)

Coroutine TCP server for auxiliary listeners inside a worker or standalone coroutine program

- `__construct(string $host, int $port, Omnitrix\Core\Runtime\Exception\ExceptionHandlerInterface $exceptionHandler, int $maxConnections = 1024, int $backlog = 512)`
- `port(): int` — The bound port (useful with port 0).
- `serve(callable $handler): void` — Accept loop; returns after {@see stop()}. Run it in its own coroutine.
- `isRunning(): bool`
- `stop(): void` — Stops accepting (the loop exits within 0.5 s) and closes the listener.
- `close(): void`
- `accepted(): int`
- `activeConnections(): int`

### TempFiles (class)

Temporary files with guaranteed cleanup. Files are created with unpredictable names

- `__construct(?string $directory = NULL, Omnitrix\Core\IO\Filesystem $filesystem = …)`
- `create(string $prefix = 'omnitrix-', string $suffix = '.tmp'): string`
- `forRequest(Omnitrix\Core\Runtime\Context\RequestContext $context, string $prefix = 'omnitrix-', string $suffix = '.tmp'): string` — Creates a temp file removed automatically when `$context` is disposed.
- `remove(string $path): void`
- `cleanup(): int`
- `count(): int`

### UdpSocket (class)

Coroutine UDP socket (datagrams; no delivery guarantee).

- `__construct(string $bindHost = '0.0.0.0', int $bindPort = 0)`
- `port(): int`
- `sendTo(string $address, int $port, string $data): void`
- `receive(float $timeout = 5.0): array` — Waits for one datagram.
- `close(): void`

## Omnitrix\Core\Log

### JsonLogger (class)

Minimal structured (one JSON object per line) PSR-3 logger writing to a stream.

- `__construct($stream = NULL, array $redactKeys = …, bool $includeTraces = false, string $channel = 'omnitrix', string $minimumLevel = 'debug')`
- `log($level, Stringable|string $message, array $context = …): void`

## Omnitrix\Core\Observability

### MetricsRegistry (class)

Request metrics in OpenSwoole shared memory: every worker records into the same table (create

- `__construct(int $maxSeries = 4096)`
- `observe(string $route, string $method, int $status, float $seconds): void`
- `series(): array`
- `render(array $gauges = …): string` — Prometheus text exposition (v0.0.4).
- `maxSeen(): int`

## Omnitrix\Core\Pool

### ClientPool (class)

Bounded pool of reusable client objects (HTTP connections, Redis clients…) for one worker.

- `__construct(string $key, int $max, float $acquireTimeout, float $idleTimeout, Closure $factory, Closure $destroyer, ?Closure $validator = NULL, float $validationInterval = 0.0)`
- `acquire(?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): object`
- `release(object $client, bool $healthy = true): void`
- `evict(): int` — Closes idle clients unused for longer than the idle timeout.
- `close(): void`
- `stats(): array`

### PoolTimeoutException (class)

No pooled client became available within the acquisition timeout (backpressure signal).


## Omnitrix\Core\Process

### CpuException (class)

Base class of CPU pool errors.


### CpuJobException (class)

The job threw inside the worker process; the worker survives. Carries the remote class name.

- `__construct(string $message, string $remoteClass)`

### CpuPool (class)

Client side of the CPU pool, used from HTTP workers (or any coroutine).

- `__construct(Omnitrix\Core\Process\CpuPoolConfig $config, Omnitrix\Core\Process\CpuLoadBoard $board)`
- `run(string $job, array $args = …, ?float $timeout = NULL): mixed` — Runs a registered job with JSON-compatible arguments and returns its JSON-compatible result.
- `stats(): array`

### CpuPoolConfig (class)

CPU pool settings.

- `__construct(int $workers = 2, float $timeout = 30.0, int $maxPending = 64, string $socketDirectory = '', string $name = 'default')`
- `socketPath(int $index): string`

### CpuTimeoutException (class)

The job did not finish in time; if it had started, its worker process was killed and is restarted.


### WorkerCrashedException (class)

The worker process died while running the job (fatal error, OOM, signal). It is restarted.


## Omnitrix\Core\Queue

### Job (class)

An immutable queued job. The JSON form is what lives in Redis.

- `__construct(string $id, string $name, array $payload, string $queue = 'default', int $attempts = 0, int $maxAttempts = 3, float $createdAt = 0.0, ?string $lastError = NULL)`
- `static create(string $name, array $payload, string $queue = 'default', int $maxAttempts = 3): Omnitrix\Core\Queue\Job`
- `withAttempt(?string $error): Omnitrix\Core\Queue\Job`
- `hasAttemptsLeft(): bool`
- `toJson(): string`
- `static fromJson(string $json): Omnitrix\Core\Queue\Job`

### QueueConsumer (class)

Processes jobs from one queue with `$concurrency` coroutines in a long-running consumer

- `__construct(Omnitrix\Core\Queue\RedisQueue $queue, array $handlers, string $queueName = 'default', int $concurrency = 4, float $jobTimeout = 60.0, float $backoffBase = 1.0, float $backoffMax = 300.0, Psr\Log\LoggerInterface $logger = …, ?string $consumerId = NULL)`
- `run(): void` — Blocks until stop() was called and in-flight jobs finished. Run inside a coroutine.
- `stop(): void`
- `isRunning(): bool`
- `stats(): array`
- `handlerCount(): int`

### QueueException (class)


### QueueProducer (class)

Producer side of the queue, used by request handlers (one per worker).

- `__construct(Omnitrix\Core\Queue\RedisQueue $queue, string $defaultQueue = 'default', int $defaultMaxAttempts = 3)`
- `dispatch(string $name, array $payload = …, float $delay = 0.0, ?string $queue = NULL, ?int $maxAttempts = NULL): string` — Enqueues `$name` with a JSON-compatible payload; returns the job id.
- `stats(?string $queue = NULL): array`

### RedisQueue (class)

Reliable queue on Redis lists.

- `__construct(Omnitrix\Core\Redis\RedisClient $redis)`
- `push(Omnitrix\Core\Queue\Job $job, float $delay = 0.0): void` — Enqueues a job, optionally delayed by `$delay` seconds.
- `reserve(string $queue, string $consumer, int $timeout = 1): ?array` — Waits up to `$timeout` seconds (whole seconds, ≥ 1) for a job and moves it to the
- `ack(string $queue, string $consumer, string $raw): void` — Removes a finished job from the processing list.
- `retry(string $queue, string $consumer, string $raw, Omnitrix\Core\Queue\Job $next, float $delay): void` — Re-schedules a failed job after `$delay` seconds (atomic move).
- `bury(string $queue, string $consumer, string $raw, Omnitrix\Core\Queue\Job $final): void` — Moves a job that exhausted its attempts to the dead letter list (atomic).
- `heartbeat(string $consumer, int $ttl): void` — Marks a consumer alive for `$ttl` seconds.
- `forgetConsumer(string $consumer): void`
- `recover(string $queue): int` — Returns jobs held by consumers whose heartbeat expired (crashed or killed) to `ready`.
- `stats(string $queue): array`
- `deadLetters(string $queue, int $limit = 100): array`
- `promoteDue(string $queue): int` — Moves due delayed jobs to `ready` (atomic Lua script).
- `purge(string $queue): void` — Deletes every key of a queue (tests / administration).
- `static key(string $queue, string $suffix): string`

## Omnitrix\Core\Redis

### ErrorClassifier (class)

Maps phpredis exceptions (message-based; phpredis has no error codes) to typed exceptions.

- `static classify(Throwable $e, string $context = ''): Omnitrix\Core\Redis\Exception\RedisException`

## Omnitrix\Core\Redis\Exception

### CommandException (class)

The server rejected a command (WRONGTYPE, syntax, NOAUTH…); the connection stays usable.


### ConnectionException (class)

Connect/auth failure, lost connection or read timeout; the pooled connection is discarded.


### RedisException (class)

Base class of Redis errors raised by Omnitrix.


### TimeoutException (class)

A read timed out (blocking command or slow server); the connection is discarded.


## Omnitrix\Core\Redis

### RedisClient (class)

Coroutine-safe Redis access: every command leases a pooled connection for its duration.

- `__construct(Omnitrix\Core\Redis\RedisConfig $config, ?Omnitrix\Core\Redis\RedisPool $pool = NULL)`
- `pool(): Omnitrix\Core\Redis\RedisPool`
- `withConnection(callable $fn, ?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): mixed` — Runs `$fn` with a leased connection. Connection-class failures discard the connection.
- `command(string $name, array $args = …): mixed` — Any command by name (`$redis->rawCommand`), for commands without a typed helper.
- `get(string $key): ?string`
- `set(string $key, string $value, ?int $ttl = NULL): bool`
- `setIfAbsent(string $key, string $value, ?int $ttl = NULL): bool` — SET NX (returns false when the key exists).
- `mget(array $keys): array`
- `delete(string ...$keys): int`
- `exists(string $key): bool`
- `expire(string $key, int $seconds): bool`
- `ttl(string $key): int` — Remaining TTL in seconds, -1 without expiry, -2 when missing.
- `increment(string $key, int $by = 1): int`
- `decrement(string $key, int $by = 1): int`
- `hget(string $key, string $field): ?string`
- `hset(string $key, string $field, string $value): void`
- `hgetall(string $key): array`
- `lpush(string $key, string ...$values): int`
- `rpush(string $key, string ...$values): int`
- `lpop(string $key): ?string`
- `llen(string $key): int`
- `blpop(array $keys, int $timeout): ?array` — Blocking pop (BLPOP) bounded by `$timeout` seconds; null when nothing arrived. The pooled
- `sadd(string $key, string ...$members): int`
- `smembers(string $key): array`
- `pipeline(callable $commands): array` — Queues commands on one connection and sends them in one round trip.
- `transaction(callable $commands): array` — MULTI/EXEC transaction (atomic on the server).
- `publish(string $channel, string $message): int`
- `subscribe(array $channels, callable $handler, ?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): void` — Subscribes on a dedicated connection and delivers messages to `$handler` until it returns
- `ping(): bool`
- `stats(): array`
- `close(): void`
- `getMany(array $keys): array`
- `throwIfUnavailable(): void`

### RedisConfig (class)

Validated `redis` configuration section.

- `static fromArray(array $config): Omnitrix\Core\Redis\RedisConfig`

### RedisPool (class)

Pool of phpredis connections for one worker. Each connection is used by one coroutine at a

- `__construct(Omnitrix\Core\Redis\RedisConfig $config)`
- `connect(): Redis` — Opens a fresh, authenticated connection outside the pool (pub/sub, blocking consumers).
- `acquire(?Omnitrix\Core\Concurrency\CancellationToken $token = NULL): Redis`
- `release(Redis $redis, bool $healthy = true): void`
- `stats(): array`
- `close(): void`

## Omnitrix\Core\Runtime\Config

### InvalidConfigurationException (class)

A configuration value is missing, has the wrong type or is out of range.

- `static at(string $path, string $problem): Omnitrix\Core\Runtime\Config\InvalidConfigurationException`

### RuntimeConfig (class)

Validated, immutable runtime/server configuration.

- `static fromArray(array $config): Omnitrix\Core\Runtime\Config\RuntimeConfig`
- `toOpenSwooleSettings(): array` — The OpenSwoole `Server::set()` array. Explicit options win over `extraOptions`.

### ServerMode (enum)

OpenSwoole process model.

- `openSwooleMode(): int`
- `static cases(): array`
- `static from(string|int $value): static`
- `static tryFrom(string|int $value): ?static`

## Omnitrix\Core\Runtime\Context

### ContextNotAvailableException (class)

Raised when request-scoped state is accessed outside of a request coroutine (or its children).


### ContextStorage (class)

Coroutine-local storage for the current {@see RequestContext}.

- `static bind(Omnitrix\Core\Runtime\Context\RequestContext $context): void` — Binds a context to the current coroutine.
- `static unbind(): void` — Removes the binding from the current coroutine (does not dispose the context).
- `static current(): ?Omnitrix\Core\Runtime\Context\RequestContext` — The context bound to this coroutine or inherited from an ancestor, or null.
- `static require(): Omnitrix\Core\Runtime\Context\RequestContext`

### RequestContext (class)

Per-request state container.

- `__construct(string $id)`
- `static create(): Omnitrix\Core\Runtime\Context\RequestContext`
- `elapsed(): float` — Seconds elapsed since the context was created.
- `set(string $key, mixed $value): void`
- `get(string $key, mixed $default = NULL): mixed`
- `has(string $key): bool`
- `remove(string $key): void`
- `all(): array`
- `setDeadline(float $unixTimestamp): void` — Absolute deadline as a unix timestamp (float seconds). Consumers (pools, clients) read
- `deadline(): ?float`
- `remainingTime(): ?float` — Seconds until the deadline (may be negative once expired), or null when no deadline.
- `isExpired(): bool`
- `defer(callable $callback): void` — Registers a callback executed when the request ends. Callbacks run in reverse
- `isDisposed(): bool`
- `dispose(): array` — Runs deferred callbacks (LIFO) and clears attributes. Idempotent.

## Omnitrix\Core\Runtime\Coroutine

### Coroutines (class)

Guarded coroutine creation.

- `static spawn(callable $body, Omnitrix\Core\Runtime\Exception\ExceptionHandlerInterface $handler, array $context = …): int`

### Sleep (class)

Cooperative sleep with sub-second resolution.

- `static for(float $seconds): void`
- `static milliseconds(int $ms): void`

### Timers (class)

Thin, typed wrapper around OpenSwoole timers.

- `static after(int $ms, callable $callback): ?int` — Schedules `$callback` once after `$ms` milliseconds; returns the timer id or null.
- `static tick(int $ms, callable $callback): ?int` — Schedules `$callback` every `$ms` milliseconds; returns the timer id or null.
- `static clear(int $timerId): bool`
- `static exists(int $timerId): bool`
- `static clearAll(): void`

## Omnitrix\Core\Runtime\Exception

### ErrorHandler (class)

Converts PHP warnings/notices/deprecations into {@see ErrorException}s so they surface

- `register(): void`
- `unregister(): void`
- `isRegistered(): bool`

### ExceptionHandlerInterface (interface)

Receives every exception the runtime catches at a coroutine boundary (request handlers,

- `handle(Throwable $exception, array $context = …): void`

### LoggingExceptionHandler (class)

Logs exceptions at `error` level with the originating context. If the logger itself fails,

- `__construct(Psr\Log\LoggerInterface $logger)`
- `handle(Throwable $exception, array $context = …): void`

## Omnitrix\Core\Runtime\Lifecycle

### LifecycleState (enum)

- `static cases(): array`
- `static from(string|int $value): static`
- `static tryFrom(string|int $value): ?static`

### ServerRuntime (class)

Application lifecycle root: Created → Built → Running → Stopped.

- `static create(array $config, ?Psr\Log\LoggerInterface $logger = NULL, ?Omnitrix\Core\Runtime\Exception\ExceptionHandlerInterface $exceptionHandler = NULL): Omnitrix\Core\Runtime\Lifecycle\ServerRuntime`
- `state(): Omnitrix\Core\Runtime\Lifecycle\LifecycleState`
- `config(): array`
- `runtimeConfig(): Omnitrix\Core\Runtime\Config\RuntimeConfig`
- `logger(): Psr\Log\LoggerInterface`
- `exceptionHandler(): Omnitrix\Core\Runtime\Exception\ExceptionHandlerInterface`
- `workerLifecycle(): Omnitrix\Core\Runtime\Worker\WorkerLifecycle`
- `onWorkerStart(callable $listener): Omnitrix\Core\Runtime\Lifecycle\ServerRuntime`
- `onWorkerStop(callable $listener): Omnitrix\Core\Runtime\Lifecycle\ServerRuntime`
- `configureContainer(callable $configurator): Omnitrix\Core\Runtime\Lifecycle\ServerRuntime` — Registers services in each worker's container before start listeners run.
- `handle(callable $handler): Omnitrix\Core\Runtime\Lifecycle\ServerRuntime`
- `onTask(callable $handler): Omnitrix\Core\Runtime\Lifecycle\ServerRuntime`
- `onBuild(callable $hook): Omnitrix\Core\Runtime\Lifecycle\ServerRuntime` — Runs after the server object is created and before it starts (master process); used to
- `build(): OpenSwoole\Http\Server` — Builds the server without starting it (useful for inspection and tests).
- `run(): void` — Builds (if needed) and starts the server. Blocks until the server shuts down.
- `server(): ?OpenSwoole\Http\Server`
- `stop(): void` — Requests a graceful shutdown (from any worker or the master).
- `reload(): void` — Gracefully restarts all workers.

## Omnitrix\Core\Runtime\Scheduler

### BoundedScheduler (class)

Admits at most `$limit` concurrently running coroutines (backpressure for application-level

- `__construct(int $limit, float $acquireTimeout, Omnitrix\Core\Runtime\Exception\ExceptionHandlerInterface $exceptionHandler)`
- `spawn(callable $task, ?callable $onComplete = NULL, ?float $acquireTimeout = NULL): int` — Starts `$task` in a new coroutine once a slot is free. Returns the coroutine id.
- `run(callable $task, ?float $acquireTimeout = NULL): mixed` — Runs `$task` inline in the current coroutine while holding a slot.
- `running(): int`
- `available(): int`
- `stats(): array`

### SchedulerSaturatedException (class)

The bounded scheduler could not admit a task within the acquisition timeout.


## Omnitrix\Core\Runtime\Shutdown

### ResourceRegistry (class)

Tracks worker-scoped resources (pools, sockets, timers, temp files) and releases them in a

- `register(string $name, callable $closer, int $priority = 0): void`
- `has(string $name): bool`
- `forget(string $name): void` — Removes a resource without closing it (the owner released it already).
- `names(): array`
- `count(): int`
- `releaseAll(): array` — Releases everything. Idempotent and re-entrancy safe.

### SignalHandler (class)

Signal handling for standalone coroutine runtimes (queue consumers, CPU pools, tooling).

- `onTerminate(callable $onSignal, array $signals = …): void`
- `release(): void`
- `installedSignals(): array`

## Omnitrix\Core\Runtime\Worker

### WorkerContext (class)

Everything a worker-scoped service may need at start-up: identity, the worker container,

- `__construct(int $workerId, int $pid, Omnitrix\Core\Runtime\Worker\WorkerRole $role, Omnitrix\Core\Container\Container $container, Omnitrix\Core\Runtime\Shutdown\ResourceRegistry $resources, ?OpenSwoole\Server $server)`

### WorkerRole (enum)

- `static cases(): array`
- `static from(string|int $value): static`
- `static tryFrom(string|int $value): ?static`

## Omnitrix\Core\Support

### Id (class)

Opaque identifiers (request ids, task ids). Cryptographically random, URL-safe hex.

- `static generate(): string` — 32 hex characters (128 bits).

### Platform (class)

Read-only facts about the runtime the framework is executing on.

- `static phpVersion(): string`
- `static hasOpenSwoole(): bool`
- `static openSwooleVersion(): ?string`
- `static kernelVersion(): ?string` — Kernel release string such as "4.14.190" (Linux) or null when not determinable.
- `static supportsIoUring(): bool` — Whether the io_uring reactor can be *requested* safely: the extension exposes the
- `static inCoroutine(): bool`
- `static assertSupported(): void`

### RuntimeRequirementException (class)

Thrown when the process does not satisfy a hard runtime requirement of the framework


## Omnitrix\Database

### Collection (class)

An ordered list of models returned by queries. Serialises to a JSON array.

- `__construct(iterable $items = …)`
- `all(): array`
- `first(): ?Omnitrix\Database\Model`
- `last(): ?Omnitrix\Database\Model`
- `isEmpty(): bool`
- `isNotEmpty(): bool`
- `count(): int`
- `map(callable $callback): array`
- `filter(callable $callback): Omnitrix\Database\Collection`
- `each(callable $callback): void`
- `pluck(string $attribute): array`
- `keyBy(string $attribute): array`
- `modelKeys(): array`
- `load(array|string ...$relations): Omnitrix\Database\Collection` — Eager loads relations for every model in the collection with one query per relation.
- `toArray(): array`
- `jsonSerialize(): array`
- `getIterator(): Traversable`
- `offsetExists(mixed $offset): bool`
- `offsetGet(mixed $offset): ?Omnitrix\Database\Model`
- `offsetSet(mixed $offset, mixed $value): void`
- `offsetUnset(mixed $offset): void`

### DatabaseCreator (class)

Creates the database named in the `database` configuration when it does not exist yet. Used by

- `__construct(array $section, ?string $connection = NULL)`
- `static isUnknownDatabase(Throwable $error): bool` — True when `$error` (or one of its previous exceptions) is MySQL's "Unknown database".
- `name(): string`
- `create(): void` — Creates the database (if it does not exist) with the configured charset and collation.

## Omnitrix\Database\Migrations

### Migration (abstract class)

A schema change. Migration files in `database/migrations/` return an instance:

- `up(Omnitrix\Database\Schema\Schema $schema): void`
- `down(Omnitrix\Database\Schema\Schema $schema): void`

### Migrator (class)

Runs migration files in filename order and records each one, with a batch number, in the

- `__construct(Omnitrix\Core\Database\DatabaseManager $databases, string $path, ?callable $listener = NULL)`
- `migrate(): array` — Runs every pending migration in one new batch.
- `rollback(int $steps = 1): array` — Reverts the last `$steps` batches (most recent first).
- `reset(): array` — Reverts every migration that ran.
- `fresh(): array` — Drops every table of the default connection, then runs all migrations.
- `status(): array`
- `files(): array`
- `ran(): array`
- `ensureRepository(): void`

## Omnitrix\Database

### Model (abstract class)

A database row as an object, with relationships.

- `__construct(array $attributes = …)`
- `static query(): Omnitrix\Database\ModelQuery`
- `static all(): Omnitrix\Database\Collection`
- `static find(string|int $id): ?static`
- `static findOrFail(string|int $id): static`
- `static create(array $attributes): static`
- `static with(array|string ...$relations): Omnitrix\Database\ModelQuery`
- `static where(Omnitrix\Core\Database\Query\Expression|Closure|array|string $column, mixed $operator = NULL, mixed $value = NULL): Omnitrix\Database\ModelQuery`
- `static table(): string`
- `static keyName(): string`
- `static foreignKeyName(): string` — Foreign key other tables use to reference this model: `User` → `user_id`.
- `static connection(): Omnitrix\Core\Database\Database`
- `static usesTimestamps(): bool`
- `fill(array $attributes): static` — Sets fillable attributes; keys not listed in `$fillable` are ignored.
- `forceFill(array $attributes): static` — Sets attributes without the `$fillable` check. Use only with trusted input.
- `getAttribute(string $key): mixed`
- `setAttribute(string $key, mixed $value): void`
- `getKey(): string|int|null`
- `exists(): bool`
- `getAttributes(): array`
- `getDirty(): array`
- `isDirty(?string $attribute = NULL): bool`
- `save(): bool` — Inserts the model, or updates the changed attributes of an existing one.
- `update(array $attributes): bool` — Fills and saves in one step.
- `delete(): bool`
- `refresh(): static` — Reloads the attributes from the database and forgets loaded relations.
- `load(array|string ...$relations): static` — Eager loads relations on this model (see {@see ModelQuery::with()}).
- `setRelation(string $name, Omnitrix\Database\Model|Omnitrix\Database\Collection|null $value): void`
- `relationLoaded(string $name): bool`
- `getRelation(string $name): Omnitrix\Database\Model|Omnitrix\Database\Collection|null`
- `toArray(): array`
- `jsonSerialize(): array`
- `offsetExists(mixed $offset): bool`
- `offsetGet(mixed $offset): mixed`
- `offsetSet(mixed $offset, mixed $value): void`
- `offsetUnset(mixed $offset): void`

### ModelNotFoundException (class)

No row matched `findOrFail()` / `firstOrFail()`. Answered as `404` when it reaches the kernel.

- `__construct(string $model, array $ids = …)`

### ModelQuery (class)

Query builder that returns models. Every filter, ordering and aggregate of the database

- `__construct(string $model, Omnitrix\Core\Database\Query\Builder $builder)`
- `with(array|string ...$relations): Omnitrix\Database\ModelQuery` — Eager loads relations with the results: `with('author')`, nested `with('posts.comments')`,
- `where(Omnitrix\Core\Database\Query\Expression|Closure|array|string $column, mixed $operator = NULL, mixed $value = NULL): Omnitrix\Database\ModelQuery`
- `whereIn(string $column, array $values): Omnitrix\Database\ModelQuery`
- `whereNull(string $column): Omnitrix\Database\ModelQuery`
- `select(Omnitrix\Core\Database\Query\Expression|string ...$columns): Omnitrix\Database\ModelQuery`
- `orderBy(string $column, string $direction = 'asc'): Omnitrix\Database\ModelQuery`
- `orderByDesc(string $column): Omnitrix\Database\ModelQuery`
- `latest(string $column = 'created_at'): Omnitrix\Database\ModelQuery` — Newest first by `created_at` (or another column).
- `oldest(string $column = 'created_at'): Omnitrix\Database\ModelQuery` — Oldest first by `created_at` (or another column).
- `limit(int $limit): Omnitrix\Database\ModelQuery`
- `offset(int $offset): Omnitrix\Database\ModelQuery`
- `get(): Omnitrix\Database\Collection`
- `first(): ?Omnitrix\Database\Model`
- `firstOrFail(): Omnitrix\Database\Model`
- `find(string|int $id): ?Omnitrix\Database\Model`
- `findOrFail(string|int $id): Omnitrix\Database\Model`
- `findMany(array $ids): Omnitrix\Database\Collection`
- `paginate(int $perPage = 15, int $page = 1): Omnitrix\Database\Paginator` — Counts the matching rows, then loads one page (pages start at 1).
- `create(array $attributes): Omnitrix\Database\Model` — Creates and saves a model.
- `update(array $values): int` — Updates every matching row without loading models.
- `delete(): int` — Deletes every matching row without loading models.
- `toBase(): Omnitrix\Core\Database\Query\Builder` — The underlying database query builder.
- `modelClass(): string`
- `qualify(string $column): string`

### Paginator (class)

One page of models with totals. Serialises to

- `__construct(Omnitrix\Database\Collection $items, int $total, int $perPage, int $currentPage)`
- `hasMorePages(): bool`
- `toArray(): array`
- `jsonSerialize(): array`

## Omnitrix\Database\Relations

### BelongsTo (class)

`posts.user_id` → `users.id`: a post belongs to its author.

- `__construct(Omnitrix\Database\Model $child, string $related, string $foreignKey, string $ownerKey)`
- `getResults(): ?Omnitrix\Database\Model`
- `associate(?Omnitrix\Database\Model $owner): Omnitrix\Database\Model` — Points the child at `$owner` (or nowhere) without saving.
- `dissociate(): Omnitrix\Database\Model`

### BelongsToMany (class)

Many-to-many through a pivot table: `posts` ↔ `post_tag(post_id, tag_id)` ↔ `tags`.

- `__construct(Omnitrix\Database\Model $parent, string $related, string $pivotTable, string $foreignPivotKey, string $relatedPivotKey, string $parentKey, string $relatedKey)`
- `getResults(): Omnitrix\Database\Collection`
- `get(): Omnitrix\Database\Collection`
- `attach(Omnitrix\Database\Model|array|string|int $ids, array $attributes = …): void` — Adds pivot rows linking the parent to the given models or ids.
- `detach(Omnitrix\Database\Model|array|string|int|null $ids = NULL): int` — Removes pivot rows for the given models or ids, or all of the parent's rows.
- `sync(array $ids): array` — Makes the given ids the complete set of related rows.

### HasMany (class)

`users.id` ← `posts.user_id`: a user has many posts.

- `getResults(): Omnitrix\Database\Collection`

### HasOne (class)

`users.id` ← `profiles.user_id`: a user has one profile.

- `getResults(): ?Omnitrix\Database\Model`

### HasOneOrMany (abstract class)

Shared behaviour of {@see HasOne} and {@see HasMany}: the related table holds a foreign key

- `__construct(Omnitrix\Database\Model $parent, string $related, string $foreignKey, string $localKey)`
- `create(array $attributes): Omnitrix\Database\Model` — Creates a related model with the foreign key set to this parent.
- `save(Omnitrix\Database\Model $model): Omnitrix\Database\Model` — Sets the foreign key on an existing model and saves it.

### Relation (abstract class)

A relationship between a model and other models. Calling the relation method returns a

- `__construct(Omnitrix\Database\Model $parent, string $related)`
- `getResults(): Omnitrix\Database\Model|Omnitrix\Database\Collection|null` — The related models for the parent: a model or null for single relations, a collection for
- `query(): Omnitrix\Database\ModelQuery`
- `get(): Omnitrix\Database\Collection`
- `first(): ?Omnitrix\Database\Model`

## Omnitrix\Database\Schema

### Blueprint (class)

Describes a table to create or the changes to apply to an existing one. Used in migrations:

- `__construct(string $table, bool $creating)`
- `id(string $column = 'id'): Omnitrix\Database\Schema\ColumnDefinition` — Auto-incrementing `BIGINT UNSIGNED` primary key.
- `bigIncrements(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `increments(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `foreignId(string $column): Omnitrix\Database\Schema\ColumnDefinition` — `BIGINT UNSIGNED` column meant to reference another table's `id`; chain `->constrained()`.
- `string(string $column, int $length = 255): Omnitrix\Database\Schema\ColumnDefinition`
- `char(string $column, int $length = 255): Omnitrix\Database\Schema\ColumnDefinition`
- `text(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `mediumText(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `longText(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `uuid(string $column = 'uuid'): Omnitrix\Database\Schema\ColumnDefinition`
- `enum(string $column, array $values): Omnitrix\Database\Schema\ColumnDefinition`
- `json(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `binary(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `tinyInteger(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `smallInteger(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `integer(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `bigInteger(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `unsignedInteger(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `unsignedBigInteger(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `decimal(string $column, int $precision = 8, int $scale = 2): Omnitrix\Database\Schema\ColumnDefinition`
- `float(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `double(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `boolean(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `date(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `time(string $column): Omnitrix\Database\Schema\ColumnDefinition`
- `dateTime(string $column, int $precision = 0): Omnitrix\Database\Schema\ColumnDefinition`
- `timestamp(string $column, int $precision = 0): Omnitrix\Database\Schema\ColumnDefinition`
- `timestamps(): void` — Nullable `created_at` and `updated_at`, maintained by models with timestamps enabled.
- `primary(array|string $columns, ?string $name = NULL): void`
- `unique(array|string $columns, ?string $name = NULL): void`
- `index(array|string $columns, ?string $name = NULL): void`
- `fullText(array|string $columns, ?string $name = NULL): void`
- `foreign(array|string $columns): Omnitrix\Database\Schema\ForeignKeyDefinition`
- `dropColumn(string ...$columns): void`
- `renameColumn(string $from, string $to): void`
- `dropIndex(string $name): void` — Drops an index by name (see {@see indexName()} for generated names).
- `dropForeign(string $name): void` — Drops a foreign key by name (see {@see indexName()} for generated names).
- `columns(): array`
- `foreignKeys(): array`
- `indexes(): array` — Explicit indexes plus those declared on columns (`->unique()`, `->index()`).
- `droppedColumns(): array`
- `droppedIndexes(): array`
- `droppedForeignKeys(): array`
- `renamedColumns(): array`
- `indexName(string $type, array $columns): string` — Generated constraint name: `{table}_{columns}_{type}`, e.g. `posts_user_id_foreign`.
- `static guessTable(string $column): string` — `user_id` → `users`, `category_id` → `categories`.

### ColumnDefinition (class)

One column of a {@see Blueprint}. Modifiers return the definition so they can be chained:

- `__construct(string $name, string $type, array $parameters = …, ?Omnitrix\Database\Schema\Blueprint $blueprint = NULL)`
- `nullable(bool $nullable = true): Omnitrix\Database\Schema\ColumnDefinition`
- `default(Omnitrix\Core\Database\Query\Expression|string|int|float|bool|null $value): Omnitrix\Database\Schema\ColumnDefinition`
- `unsigned(): Omnitrix\Database\Schema\ColumnDefinition`
- `autoIncrement(): Omnitrix\Database\Schema\ColumnDefinition`
- `primary(): Omnitrix\Database\Schema\ColumnDefinition`
- `unique(): Omnitrix\Database\Schema\ColumnDefinition`
- `index(): Omnitrix\Database\Schema\ColumnDefinition`
- `comment(string $comment): Omnitrix\Database\Schema\ColumnDefinition`
- `after(string $column): Omnitrix\Database\Schema\ColumnDefinition` — Places the column after another one (ALTER TABLE only).
- `useCurrent(): Omnitrix\Database\Schema\ColumnDefinition` — `DEFAULT CURRENT_TIMESTAMP` for timestamp and datetime columns.
- `useCurrentOnUpdate(): Omnitrix\Database\Schema\ColumnDefinition` — `ON UPDATE CURRENT_TIMESTAMP` for timestamp and datetime columns.
- `charset(string $charset): Omnitrix\Database\Schema\ColumnDefinition`
- `collation(string $collation): Omnitrix\Database\Schema\ColumnDefinition`
- `constrained(?string $table = NULL, string $column = 'id'): Omnitrix\Database\Schema\ForeignKeyDefinition` — Adds a foreign key on this column referencing `$table.$column`. Without a table name it

### ForeignKeyDefinition (class)

A foreign key constraint: `$table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete()`.

- `__construct(array $columns)`
- `references(string ...$columns): Omnitrix\Database\Schema\ForeignKeyDefinition`
- `on(string $table): Omnitrix\Database\Schema\ForeignKeyDefinition`
- `name(string $name): Omnitrix\Database\Schema\ForeignKeyDefinition`
- `onDelete(string $action): Omnitrix\Database\Schema\ForeignKeyDefinition`
- `onUpdate(string $action): Omnitrix\Database\Schema\ForeignKeyDefinition`
- `cascadeOnDelete(): Omnitrix\Database\Schema\ForeignKeyDefinition`
- `nullOnDelete(): Omnitrix\Database\Schema\ForeignKeyDefinition`
- `restrictOnDelete(): Omnitrix\Database\Schema\ForeignKeyDefinition`
- `cascadeOnUpdate(): Omnitrix\Database\Schema\ForeignKeyDefinition`

### Schema (class)

Creates, changes and drops tables on one connection (MySQL/MariaDB). Migrations receive an

- `__construct(Omnitrix\Core\Database\Database $db)`
- `create(string $table, callable $define): void`
- `table(string $table, callable $define): void`
- `drop(string $table): void`
- `dropIfExists(string $table): void`
- `rename(string $from, string $to): void`
- `hasTable(string $table): bool`
- `hasColumn(string $table, string $column): bool`
- `tables(): array`
- `dropAllTables(): void` — Drops every table of the current database, ignoring foreign keys while doing so. Used by
- `toSql(Omnitrix\Database\Schema\Blueprint $blueprint): array`

### SchemaGrammar (class)

Compiles {@see Blueprint}s into MySQL/MariaDB DDL statements.

- `compile(Omnitrix\Database\Schema\Blueprint $blueprint): array`
- `compileCreate(Omnitrix\Database\Schema\Blueprint $blueprint): string`
- `compileAlter(Omnitrix\Database\Schema\Blueprint $blueprint): array`
- `compileDrop(string $table, bool $ifExists): string`
- `compileRename(string $from, string $to): string`
- `wrap(string $identifier): string`
- `column(Omnitrix\Database\Schema\ColumnDefinition $column, bool $inlinePrimary): string`

## Omnitrix\Database\Seeding

### Seeder (abstract class)

Fills the database with data. `php omnitrix db:seed` runs `Database\Seeds\DatabaseSeeder`,

- `run(): void`
- `call(string ...$seeders): void`

## Omnitrix\Facades

### Async (class)

Public entry point for structured concurrency (documentation: Async & services → Concurrency).

- `static all(array $tasks, ?float $timeout = NULL, ?int $concurrency = NULL): array`
- `static allSettled(array $tasks, ?float $timeout = NULL, ?int $concurrency = NULL): array`
- `static race(array $tasks, ?float $timeout = NULL): mixed`
- `static withTimeout(callable $body, float $timeout): mixed`
- `static scope(callable $body, ?int $concurrency = NULL): mixed`
- `static sleep(float $seconds): void`

### Cache (class)

Application cache (documentation: Async & services → Redis and cache).

- `static store(): Omnitrix\Core\Cache\Cache`
- `static get(string $key, mixed $default = NULL): mixed`
- `static set(string $key, mixed $value, ?int $ttl = NULL): bool`
- `static add(string $key, mixed $value, ?int $ttl = NULL): bool`
- `static has(string $key): bool`
- `static delete(string ...$keys): int`
- `static remember(string $key, ?int $ttl, callable $compute): mixed`
- `static increment(string $key, int $by = 1): int`

### Cpu (class)

CPU worker pool (documentation: Async & services → CPU pool).

- `static pool(): Omnitrix\Core\Process\CpuPool`
- `static run(string $job, array $args = …, ?float $timeout = NULL): mixed`

### DB (class)

Database access (documentation: Database).

- `static manager(): Omnitrix\Core\Database\DatabaseManager`
- `static connection(?string $name = NULL): Omnitrix\Core\Database\Database`
- `static table(string $table): Omnitrix\Core\Database\Query\Builder`
- `static query(): Omnitrix\Core\Database\Query\Builder`
- `static select(string $sql, array $bindings = …): array`
- `static selectOne(string $sql, array $bindings = …): ?array`
- `static execute(string $sql, array $bindings = …): int`
- `static insert(string $sql, array $bindings = …): int`
- `static transaction(callable $callback, int $attempts = 1): mixed`
- `static raw(string $sql, array $bindings = …): Omnitrix\Core\Database\Query\Expression`

### Facade (abstract class)

Static accessors over worker-scoped services.

- `static setContainer(?Psr\Container\ContainerInterface $container): void`
- `static container(): ?Psr\Container\ContainerInterface`
- `static hasContainer(): bool`

### Http (class)

Outbound HTTP (documentation: Async & services → HTTP client).

- `static client(): Omnitrix\Core\HttpClient\HttpClient`
- `static request(): Omnitrix\Core\HttpClient\PendingRequest`
- `static withHeaders(array $headers): Omnitrix\Core\HttpClient\PendingRequest`
- `static withToken(string $token, string $type = 'Bearer'): Omnitrix\Core\HttpClient\PendingRequest`
- `static timeout(float $seconds): Omnitrix\Core\HttpClient\PendingRequest`
- `static retry(int $times, bool $onTimeout = false): Omnitrix\Core\HttpClient\PendingRequest`
- `static get(string $url, array $query = …): Omnitrix\Core\HttpClient\Response`
- `static post(string $url, mixed $json = NULL): Omnitrix\Core\HttpClient\Response`
- `static put(string $url, mixed $json = NULL): Omnitrix\Core\HttpClient\Response`
- `static patch(string $url, mixed $json = NULL): Omnitrix\Core\HttpClient\Response`
- `static delete(string $url): Omnitrix\Core\HttpClient\Response`
- `static head(string $url): Omnitrix\Core\HttpClient\Response`

### Queue (class)

Background jobs (documentation: Async & services → Queues).

- `static producer(): Omnitrix\Core\Queue\QueueProducer`
- `static dispatch(string $name, array $payload = …, float $delay = 0.0, ?string $queue = NULL, ?int $maxAttempts = NULL): string`
- `static stats(?string $queue = NULL): array`

### Redis (class)

Redis access (documentation: Async & services → Redis and cache). Typed helpers for common commands; `command()` for the

- `static client(): Omnitrix\Core\Redis\RedisClient`
- `static get(string $key): ?string`
- `static set(string $key, string $value, ?int $ttl = NULL): bool`
- `static delete(string ...$keys): int`
- `static increment(string $key, int $by = 1): int`
- `static expire(string $key, int $seconds): bool`
- `static command(string $name, array $args = …): mixed`
- `static withConnection(callable $fn): mixed`
- `static pipeline(callable $commands): array`
- `static transaction(callable $commands): array`
- `static publish(string $channel, string $message): int`

## Omnitrix\Http

### Cookie (class)

Immutable Set-Cookie description.

- `__construct(string $name, string $value, int $expires = 0, string $path = '/', string $domain = '', bool $secure = false, bool $httpOnly = true, string $sameSite = 'Lax')`
- `static forget(string $name, string $path = '/', string $domain = ''): Omnitrix\Http\Cookie` — A cookie that instructs the client to delete `$name`.

### ErrorResponseFactory (class)

Converts any throwable into a JSON error {@see Response}.

- `__construct(bool $debug = false)`
- `fromThrowable(Throwable $e, string $requestId): Omnitrix\Http\Response`
- `isDebug(): bool`

## Omnitrix\Http\Exception

### BadRequestException (class)

- `__construct(string $message = 'The request could not be understood', array $headers = …, array $details = …, ?Throwable $previous = NULL)`

### HttpException (class)

An exception that maps directly to an HTTP response. The message is considered safe to show

- `__construct(int $status, string $message = '', array $headers = …, array $details = …, ?Throwable $previous = NULL)`
- `status(): int`
- `headers(): array`
- `details(): array`

### MethodNotAllowedException (class)

- `__construct(string $message = 'Method not allowed', array $headers = …, array $details = …, ?Throwable $previous = NULL)`

### NotFoundException (class)

- `__construct(string $message = 'Resource not found', array $headers = …, array $details = …, ?Throwable $previous = NULL)`

### PayloadTooLargeException (class)

- `__construct(string $message = 'Request body exceeds the allowed size', array $headers = …, array $details = …, ?Throwable $previous = NULL)`

### ServiceUnavailableException (class)

- `__construct(string $message = 'Service temporarily unavailable', array $headers = …, array $details = …, ?Throwable $previous = NULL)`

### UnsupportedMediaTypeException (class)

- `__construct(string $message = 'Unsupported Content-Type', array $headers = …, array $details = …, ?Throwable $previous = NULL)`

## Omnitrix\Http

### HttpKernel (class)

The per-worker HTTP kernel: request → router → middleware pipeline → handler → response.

- `__construct(Omnitrix\Routing\Router $router, Omnitrix\Routing\HandlerResolver $resolver, Omnitrix\Http\ErrorResponseFactory $errors, Omnitrix\Core\Runtime\Exception\ExceptionHandlerInterface $exceptionHandler)`
- `middleware(Omnitrix\Http\Middleware\MiddlewareInterface|callable ...$middleware): Omnitrix\Http\HttpKernel` — Global middleware, run for every matched route in registration order.
- `router(): Omnitrix\Routing\Router`
- `__invoke(Omnitrix\Core\Http\Server\IncomingRequest $incoming, Omnitrix\Core\Http\Server\ResponseWriter $writer, Omnitrix\Core\Runtime\Context\RequestContext $context): void` — Entry point for the server adapter.
- `handle(Omnitrix\Http\Request $request): Omnitrix\Http\Response` — Produces a Response for a Request (also usable without a server, e.g. in tests).

## Omnitrix\Http\Middleware

### MiddlewareInterface (interface)

Middleware wraps the rest of the pipeline. Call `$next($request)` to continue, or return a

- `process(Omnitrix\Http\Request $request, Omnitrix\Http\Middleware\Next $next): Omnitrix\Http\Response`

### Next (class)

The continuation handed to middleware. Calling it runs the rest of the pipeline.

- `__construct(Closure $continuation)`
- `__invoke(Omnitrix\Http\Request $request): Omnitrix\Http\Response`

### Pipeline (class)

Compiles a middleware list and a final handler into one closure, once. Dispatch is then a

- `static compile(array $middleware, callable $handler): Closure`

## Omnitrix\Http

### Request (class)

The request object handed to middleware and route handlers.

- `context(): Omnitrix\Core\Runtime\Context\RequestContext`
- `id(): string`
- `method(): string`
- `isMethod(string $method): bool`
- `path(): string`
- `queryString(): string`
- `query(): array`
- `queryParam(string $name, mixed $default = NULL): mixed`
- `headers(): array`
- `header(string $name, ?string $default = NULL): ?string`
- `hasHeader(string $name): bool`
- `bearerToken(): ?string` — Bearer token from the Authorization header, or null.
- `cookies(): array`
- `cookie(string $name, ?string $default = NULL): ?string`
- `contentType(): ?string`
- `isJson(): bool`
- `body(): string`
- `json(): mixed`
- `jsonObject(): array`
- `form(): array`
- `files(): array`
- `remoteAddress(): ?string`
- `protocolVersion(): string`
- `input(string $name, mixed $default = NULL): mixed` — A single input value: JSON object field (for JSON requests), then form field, then
- `all(): array` — All input merged (query < form < JSON object), later sources overriding earlier ones.
- `validate(array $rules): array` — Validates `all()` input against rule strings and returns only the validated fields.
- `routePattern(): ?string` — The matched route pattern (bounded cardinality; safe as a metrics label), or null.
- `route(string $name, mixed $default = NULL): mixed` — Route parameter (e.g. `{id}`) as the raw URL segment, or `$default`.
- `routeInt(string $name): int` — Route parameter cast to int; throws a 404 when it is not an integer.
- `routeParams(): array`
- `routeName(): ?string`
- `setAttribute(string $name, mixed $value): void`
- `attribute(string $name, mixed $default = NULL): mixed`
- `hasAttribute(string $name): bool`
- `attributes(): array`

### Response (class)

The response value returned by handlers and middleware.

- `__construct(string $body = '', int $status = 200, array $headers = …)`
- `static json(mixed $data, int $status = 200, int $flags = 320): Omnitrix\Http\Response`
- `static text(string $body, int $status = 200): Omnitrix\Http\Response`
- `static html(string $body, int $status = 200): Omnitrix\Http\Response`
- `static noContent(): Omnitrix\Http\Response`
- `static redirect(string $location, int $status = 302): Omnitrix\Http\Response`
- `static file(string $path, ?string $contentType = NULL, ?string $downloadName = NULL): Omnitrix\Http\Response` — Sends a file with sendfile(2).
- `static stream(callable $producer, int $status = 200, string $contentType = 'application/octet-stream'): Omnitrix\Http\Response` — Streams through a callback that writes chunks with {@see Stream::write()}; the
- `static chunks(iterable $chunks, int $status = 200, string $contentType = 'application/octet-stream'): Omnitrix\Http\Response` — Streams every string yielded by the iterable (generators welcome) as a chunk.
- `status(int $status): Omnitrix\Http\Response`
- `header(string $name, string $value): Omnitrix\Http\Response`
- `headers(array $headers): Omnitrix\Http\Response`
- `withoutHeader(string $name): Omnitrix\Http\Response`
- `cookie(Omnitrix\Http\Cookie $cookie): Omnitrix\Http\Response`
- `getStatus(): int`
- `getHeader(string $name): ?string`
- `getHeaders(): array`
- `getCookies(): array`
- `bodyType(): int`
- `getBody(): string`
- `getFile(): ?string`
- `getStream(): ?Closure`
- `getChunks(): ?iterable`

### Stream (class)

The body of a streaming response, handed to the producer of {@see Response::stream()}.

- `write(string $chunk): bool` — Sends a chunk; false when the client is gone.
- `clientGone(): bool` — True once a write reported that the client disconnected.
- `bytesWritten(): int` — Bytes sent so far.

## Omnitrix\Observability

### AccessLog (class)

One structured log line per request: method, route pattern, path, status, duration, request

- `__construct(Psr\Log\LoggerInterface $logger, array $skipPaths = …)`
- `process(Omnitrix\Http\Request $request, Omnitrix\Http\Middleware\Next $next): Omnitrix\Http\Response`

### HealthCheck (class)

Liveness and readiness. Readiness runs every registered check concurrently with a timeout;

- `__construct(float $timeout = 2.0)`
- `add(string $name, callable $check): Omnitrix\Observability\HealthCheck`
- `live(): Omnitrix\Http\Response`
- `ready(): Omnitrix\Http\Response`

## Omnitrix

### Omnitrix (class)

Framework identity constants.


## Omnitrix\Queue

### Worker (class)

A background job consumer process.

- `__construct(array $config, string $queue = 'default', int $concurrency = 4, float $jobTimeout = 60.0, float $backoffBase = 1.0, ?Psr\Log\LoggerInterface $logger = NULL)`
- `handle(string $job, callable $handler): Omnitrix\Queue\Worker` — Registers the handler for one job name.
- `run(): int` — Processes jobs until terminated; returns 0 after a graceful stop.
- `stats(): array`

## Omnitrix\RateLimit

### RateLimit (class)

Rate limiting middleware. Keyed by authenticated identity when present, otherwise by client

- `__construct(Omnitrix\RateLimit\RateLimiterInterface $limiter, int $limit, int $windowSeconds = 60, ?callable $key = NULL, string $name = 'default', ?callable $onError = NULL)`
- `process(Omnitrix\Http\Request $request, Omnitrix\Http\Middleware\Next $next): Omnitrix\Http\Response`

### RateLimitResult (class)

- `__construct(bool $allowed, int $limit, int $remaining, int $retryAfter)`

### RateLimiterInterface (interface)

Counts hits per key in fixed windows.

- `hit(string $key, int $limit, int $windowSeconds): Omnitrix\RateLimit\RateLimitResult` — Records one hit and returns the decision.

### RedisRateLimiter (class)

Fixed-window limiter shared by every worker and server (INCR + EXPIRE in one Lua call, so the

- `__construct(?Omnitrix\Core\Redis\RedisClient $redis = NULL, string $prefix = 'ratelimit:')`
- `hit(string $key, int $limit, int $windowSeconds): Omnitrix\RateLimit\RateLimitResult`

### TableRateLimiter (class)

Fixed-window limiter in OpenSwoole shared memory: shared by every worker of one server (create

- `__construct(int $maxKeys = 65536)`
- `hit(string $key, int $limit, int $windowSeconds): Omnitrix\RateLimit\RateLimitResult`

## Omnitrix\Routing

### HandlerResolver (class)

Turns a route handler declaration into a `Closure(Request): Response`-like callable, once

- `__construct(?Psr\Container\ContainerInterface $container = NULL)`
- `resolve(mixed $handler): Closure`

### Route (class)

A registered route: methods, path pattern, handler, middleware and an optional name.

- `__construct(array $methods, string $pattern, mixed $handler)`
- `middleware(Omnitrix\Http\Middleware\MiddlewareInterface|callable ...$middleware): Omnitrix\Routing\Route`
- `name(string $name): Omnitrix\Routing\Route`
- `getName(): ?string`
- `getMiddleware(): array`
- `setPipeline(Closure $pipeline): void`
- `getPipeline(): ?Closure`

### RouteMatch (class)

Result of a successful dispatch.

- `__construct(Omnitrix\Routing\Route $route, array $params)`

### Router (class)

Route registration and dispatch on top of FastRoute's GroupCountBased engine.

- `get(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `post(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `put(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `patch(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `delete(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `options(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `any(string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `map(array $methods, string $pattern, mixed $handler): Omnitrix\Routing\Route`
- `group(string $prefix, callable $define, array $middleware = …): void` — Defines routes under a common prefix and middleware set.
- `routes(): array`
- `isCompiled(): bool`
- `compile(): void` — Builds the dispatcher data. Idempotent.
- `dispatch(string $method, string $path): Omnitrix\Routing\RouteMatch`
- `routesFor(string $method): array`
- `pipelineFor(Omnitrix\Routing\Route $route, Closure $factory): Closure` — Returns the route's compiled pipeline, building it with `$factory` on first use.

## Omnitrix\Security

### Authorize (class)

Authorization hook: `Authorize::ability('orders.write')` or a custom policy

- `__construct(callable $policy)`
- `static ability(string $ability): Omnitrix\Security\Authorize`
- `process(Omnitrix\Http\Request $request, Omnitrix\Http\Middleware\Next $next): Omnitrix\Http\Response`

### BearerTokenAuth (class)

Authenticates `Authorization: Bearer <token>` through an application-supplied resolver

- `__construct(callable $resolver, bool $optional = false)`
- `process(Omnitrix\Http\Request $request, Omnitrix\Http\Middleware\Next $next): Omnitrix\Http\Response`
- `static identity(Omnitrix\Http\Request $request): ?Omnitrix\Security\Identity`

### Identity (class)

The authenticated principal attached to a request by {@see BearerTokenAuth}.

- `__construct(string $id, array $abilities = …, array $claims = …)`
- `can(string $ability): bool`

### SecurityHeaders (class)

Adds conservative security headers suited to JSON APIs (only where the handler did not set them).

- `__construct(array $headers = …, bool $hsts = false)`
- `process(Omnitrix\Http\Request $request, Omnitrix\Http\Middleware\Next $next): Omnitrix\Http\Response`

## Omnitrix\Support

### Str (class)

Naming helpers used for table, class and file names. English pluralisation rules only.

- `static snake(string $value): string` — `UserProfile`, `userProfile`, `user-profile` → `user_profile`.
- `static studly(string $value): string` — `user_profile`, `user-profile`, `user profile` → `UserProfile`.
- `static camel(string $value): string` — `user_profile` → `userProfile`.
- `static plural(string $word): string` — `post` → `posts`, `category` → `categories`, `user_profile` → `user_profiles`.
- `static singular(string $word): string` — `posts` → `post`, `categories` → `category`.

## Omnitrix\Validation

### ValidationException (class)

422 with field errors: `{"error": {"status": 422, "message": "...", "errors": {field: [messages]}}}`.

- `__construct(array $errors)`

### Validator (class)

Small rule-string validator for request input.

- `__construct(array $rules)`
- `validate(array $input): array`

---
title: Core API (omnitrix/core)
---

# Core API (omnitrix/core)

Public classes and methods, generated from the source. Classes and methods marked `@internal` are implementation details and are not listed.

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


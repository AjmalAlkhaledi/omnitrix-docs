---
title: Framework API (omnitrix/framework)
---

# Framework API (omnitrix/framework)

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

Public entry point for structured concurrency (see docs/concurrency.md).

- `static all(array $tasks, ?float $timeout = NULL, ?int $concurrency = NULL): array`
- `static allSettled(array $tasks, ?float $timeout = NULL, ?int $concurrency = NULL): array`
- `static race(array $tasks, ?float $timeout = NULL): mixed`
- `static withTimeout(callable $body, float $timeout): mixed`
- `static scope(callable $body, ?int $concurrency = NULL): mixed`
- `static sleep(float $seconds): void`

### Cache (class)

Application cache (see docs/redis.md).

- `static store(): Omnitrix\Core\Cache\Cache`
- `static get(string $key, mixed $default = NULL): mixed`
- `static set(string $key, mixed $value, ?int $ttl = NULL): bool`
- `static add(string $key, mixed $value, ?int $ttl = NULL): bool`
- `static has(string $key): bool`
- `static delete(string ...$keys): int`
- `static remember(string $key, ?int $ttl, callable $compute): mixed`
- `static increment(string $key, int $by = 1): int`

### Cpu (class)

CPU worker pool (see docs/process-pool.md).

- `static pool(): Omnitrix\Core\Process\CpuPool`
- `static run(string $job, array $args = …, ?float $timeout = NULL): mixed`

### DB (class)

Database access (see docs/database.md).

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

Outbound HTTP (see docs/http-client.md).

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

Background jobs (see docs/background-jobs.md).

- `static producer(): Omnitrix\Core\Queue\QueueProducer`
- `static dispatch(string $name, array $payload = …, float $delay = 0.0, ?string $queue = NULL, ?int $maxAttempts = NULL): string`
- `static stats(?string $queue = NULL): array`

### Redis (class)

Redis access (see docs/redis.md). Typed helpers for common commands; `command()` for the

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

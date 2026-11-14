---
sidebar_position: 4
---

# Configuration

Configuration lives in `config/`. Each file returns an array and becomes the section named after
the file: `config/database.php` is the `database` section. `bootstrap.php` loads the directory
with `Config::load()` and passes the result to `Application::create()`, which validates every
section at startup. Unknown keys, wrong types and out-of-range values stop the application with
an `InvalidConfigurationException` naming the setting, for example `server.port`.

| Section | Purpose | Documented in |
|---|---|---|
| `app` | name, environment, debug, log level | below |
| `server` | listen address, workers, process settings | [Runtime](../operations/runtime.md) |
| `http` | body size limit, request timeout, request id header | [Requests and responses](../basics/requests-responses.md) |
| `database` | MySQL/MariaDB connection and pool | [Database](../database/getting-started.md) |
| `redis`, `cache` | Redis connection, cache defaults | [Redis and cache](../async/redis-cache.md) |
| `http_client` | outbound HTTP defaults | [HTTP client](../async/http-client.md) |
| `queue` | queue name, worker concurrency, job classes | [Queues](../async/queues.md) |

Add your own files (for example `config/payments.php`) and read them with
`Config::get($app->config(), 'payments.api_url')`.

## The `app` section

| Key | Default | Meaning |
|---|---|---|
| `name` | `Omnitrix` | application name |
| `env` | `production` | `production`, `staging`, `local`, `testing`; destructive console commands require `--force` in production |
| `debug` | `false` | exception details in 500 responses — never enable in production |
| `log_level` | `info` | minimum PSR-3 level written to the log |

## Environment variables

Configuration files read the environment through `Omnitrix\Config\Env`. `bootstrap.php` loads
`.env` first; real environment variables always win over `.env`.

```php
// config/database.php
use Omnitrix\Config\Env;

return [
    'host' => Env::get('DB_HOST', '127.0.0.1'),
    'port' => Env::int('DB_PORT', 3306),
    'password' => Env::required('DB_PASSWORD'),   // fails at startup when missing
];
```

| Method | Returns |
|---|---|
| `Env::load(string $path)` | number of variables loaded; a missing file loads nothing |
| `Env::get(string $name, ?string $default = null)` | the value or the default |
| `Env::required(string $name)` | the value; throws `InvalidConfigurationException` when unset or empty |
| `Env::int(string $name, int $default)` | the integer value; throws on non-integer input |
| `Env::bool(string $name, bool $default)` | `true/false/1/0/yes/no/on/off` |

`.env` syntax: `KEY=value`, `export KEY=value`, `KEY="quoted # kept"`, `# comments`,
`KEY=value # trailing comment`. Keep `.env` out of version control (the project's `.gitignore`
does) and keep `.env.example` up to date with every variable the application reads. An empty
value such as `REDIS_PASSWORD=` means "not set".

## Reading configuration in code

```php
use Omnitrix\Config\Config;

$name = Config::string($app->config(), 'app.name', 'Omnitrix');
$jobs = Config::get($app->config(), 'queue.jobs', []);
```

Configuration is read once, in the master process, when the application starts. Change a value
and restart (or reload with SIGUSR1) to apply it.

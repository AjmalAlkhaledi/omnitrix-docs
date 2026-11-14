---
sidebar_position: 3
---

# Directory structure

```
my-api/
├── omnitrix                 the command line: php omnitrix <command>
├── bootstrap.php            builds and returns the Application
├── config/                  one file per configuration section
│   ├── app.php              name, environment, debug, log level
│   ├── server.php           host, port, workers
│   ├── http.php             body size limit, request timeout
│   ├── database.php         MySQL/MariaDB connection and pool
│   ├── redis.php            Redis connection and pool
│   ├── cache.php            cache prefix and default TTL
│   ├── http_client.php      outbound HTTP defaults
│   └── queue.php            queue name, concurrency, job classes
├── routes/
│   └── api.php              route definitions
├── src/                     your code, namespace App\
│   ├── Controllers/
│   ├── Models/
│   ├── Middleware/
│   └── Jobs/
├── database/
│   ├── migrations/          schema changes, run in filename order
│   └── seeds/               seeders, namespace Database\Seeds\
├── storage/
│   └── logs/                OpenSwoole's server log
├── tests/                   PHPUnit tests (Unit/, Feature/)
├── .env                     local settings and secrets (not committed)
├── .env.example             template for .env (committed)
└── composer.json
```

## How a request reaches your code

1. `php omnitrix serve` requires `bootstrap.php`, which loads `.env`, reads `config/`, registers
   global middleware and loads `routes/api.php`.
2. The server starts its worker processes. Each worker builds its own services (database pool,
   Redis client, HTTP client) and binds them to the facades.
3. Each request runs in a coroutine: routing, middleware, your controller, then the response.

`bootstrap.php` is plain PHP. Add global middleware, extra route files, metrics or the CPU pool
there:

```php
$app->middleware(new SecurityHeaders(), new AccessLog($app->logger()));
$app->routes(__DIR__ . '/routes/admin.php');
$app->enableMetrics('/metrics', [$metricsAuth]);
```

## Naming

| Kind | Location | Namespace | Generator |
|---|---|---|---|
| Controller | `src/Controllers` | `App\Controllers` | `make:controller` |
| Model | `src/Models` | `App\Models` | `make:model` |
| Middleware | `src/Middleware` | `App\Middleware` | `make:middleware` |
| Job | `src/Jobs` | `App\Jobs` | `make:job` |
| Migration | `database/migrations` | none (returns an object) | `make:migration` |
| Seeder | `database/seeds` | `Database\Seeds` | `make:seeder` |

Add more folders under `src/` freely (services, repositories, DTOs); everything in `src/` is
autoloaded under `App\`.

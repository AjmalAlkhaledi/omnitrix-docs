# Routing

Omnitrix routes requests with FastRoute's GroupCountBased engine (static routes are a hash
lookup, dynamic routes are grouped regular expressions) wrapped in `Omnitrix\Routing\Router`.
Routes are declared in the master process; each worker compiles the dispatcher once at start.

## Route files

Routes live in `routes/api.php`, which `bootstrap.php` loads with `$app->routes()`. The file has
`$router` (and `$app`) in scope. Load more files the same way, for example
`$app->routes(__DIR__ . '/routes/admin.php')`. `php omnitrix routes` lists everything that is
registered.

```php
<?php
// routes/api.php

use App\Controllers\UserController;
use App\Middleware\RequireAdmin;
use Omnitrix\Http\Request;
use Omnitrix\Http\Response;
use Omnitrix\Routing\Router;

/** @var Router $router */
$router->get('/', fn (): array => ['hello' => 'world']);                    // array → JSON
$router->get('/text', fn (): string => 'plain text');                       // string → text/plain
$router->get('/empty', fn () => null);                                      // null → 204
$router->get('/users/{id:\d+}', [UserController::class, 'show'])->name('users.show');
$router->get('/files/{path:.+}', fn (Request $r): array => ['path' => $r->route('path')]);
$router->map(['PUT', 'PATCH'], '/users/{id:\d+}', [UserController::class, 'update']);
$router->post('/users', UserController::class . '::store');

$router->group('/admin', function (Router $router): void {
    $router->get('/stats', StatsController::class);                         // invokable class
    $router->delete('/users/{id:\d+}', fn (): Response => Response::noContent());
}, [new RequireAdmin()]);                                                   // group middleware
```

The same methods exist on the application (`$app->get()`, `$app->group()`, …) for scripts that
build the application in a single file.

Pattern syntax (FastRoute): `{name}` matches one segment, `{name:regex}` constrains it,
`[/optional]` marks optional parts. `any()` registers GET, POST, PUT, PATCH, DELETE and
OPTIONS. `HEAD` automatically falls back to the `GET` route.

Handlers may be closures, any callable, `[Class::class, 'method']`, `'Class::method'` or an
invokable class name. Class instances are resolved once per worker from the worker container
when it has an entry for the class, otherwise with `new Class()`.

Return values: `Response`, `array`/`JsonSerializable` (JSON 200), `string` (text/plain 200),
`null` (204). Anything else is a programming error answered with 500.

## Matching results

| Situation | Result |
|---|---|
| No route for the path | `404` JSON error |
| Path exists for other methods | `405` JSON error with `Allow` header listing the methods (HEAD added when GET exists) |
| Regex constraint fails | `404` |
| `Request::routeInt()` on a non-integer parameter | `404` |

Paths are URL-decoded before matching; the query string is never part of the match.

## Request helpers

`$request->route('id')` (raw segment), `routeInt('id')`, `routeParams()`, `routeName()`,
`input('field')` (JSON object field → form field → query parameter), `all()`,
`bearerToken()`, attributes set by middleware (`setAttribute`/`attribute`).

## Dispatch cost

The router adds method normalisation, one `RouteMatch` allocation and parameter filtering on
top of raw FastRoute. `tools/bench/router_bench.php` measures raw FastRoute
dispatch, `Router::dispatch` and the full kernel path (routing, one middleware, JSON encoding)
on your own hardware (from a checkout of the `omnitrix/core` repository):

```sh
php tools/bench/router_bench.php
```

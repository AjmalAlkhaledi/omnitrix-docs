# Middleware

Middleware wraps route handlers. A middleware is either a class implementing
`Omnitrix\Http\Middleware\MiddlewareInterface` (create one with
`php omnitrix make:middleware Name`; classes live in `src/Middleware`) or a closure with the same
shape:

```php
<?php

use Omnitrix\Http\Middleware\MiddlewareInterface;
use Omnitrix\Http\Middleware\Next;
use Omnitrix\Http\Request;
use Omnitrix\Http\Response;

final class TimingMiddleware implements MiddlewareInterface
{
    public function process(Request $request, Next $next): Response
    {
        $start = hrtime(true);
        $response = $next($request);               // continue the pipeline

        return $response->header('X-Elapsed-Us', (string) (int) ((hrtime(true) - $start) / 1000));
    }
}

$requireToken = static function (Request $request, Next $next): Response {
    $token = $request->bearerToken();
    if ($token === null) {
        return Response::json(['error' => ['status' => 401, 'message' => 'missing token']], 401)
            ->header('WWW-Authenticate', 'Bearer');   // short-circuit: handler never runs
    }
    $request->setAttribute('auth.user', $token);     // visible to inner middleware and the handler

    return $next($request);
};
```

## Scopes and order

| Scope | How | Runs |
|---|---|---|
| Global | `$app->middleware($a, $b)` in `bootstrap.php` | for every matched route, in registration order |
| Group | `$router->group('/api', fn, [$m])` | for routes in the group (outer groups first) |
| Route | `$router->get(...)->middleware($m)` | for that route only |

The effective order is global → group (outermost to innermost) → route → handler. On the way
back the innermost response transformations happen first.

The pipeline for each route is compiled once per worker into nested closures (`Pipeline`),
with one `Next` continuation object per layer created at compile time; dispatching a request
allocates nothing for the pipeline itself.

## Errors inside the pipeline

Exceptions thrown by the handler are converted to a `Response` at the handler boundary, so
every middleware still receives a response (status, headers) and can log or decorate it.
`HttpException`s keep their status, headers and safe message; other throwables become a
generic `500` (details only with `debug => true`) and are reported to the exception handler.
Exceptions thrown by middleware itself, and routing failures (404/405), are converted by the
kernel above the pipeline.

Middleware that needs to react to failures inspects `$response->getStatus()`; it must not rely
on catching exceptions from `$next()`.

## Built-in middleware

Authentication, authorization, rate limiting, security headers and access logs are described in
[Security](security.md) and [Observability](../operations/observability.md). Generate a new
middleware class with `php omnitrix make:middleware RequireApiKey`.

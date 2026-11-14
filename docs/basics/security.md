# Security

Omnitrix ships middleware for the security concerns every API has. Register global middleware in
`bootstrap.php` and per-route or per-group middleware in your route files.

```php
<?php

use Omnitrix\Observability\AccessLog;
use Omnitrix\RateLimit\{RateLimit, RedisRateLimiter, TableRateLimiter};
use Omnitrix\Security\{Authorize, BearerTokenAuth, Identity, SecurityHeaders};

$auth = new BearerTokenAuth(fn (string $token): ?Identity => $tokens->find($token)); // any coroutine-friendly lookup
$limiter = new TableRateLimiter();            // per server, shared memory; create before run()
// $limiter = new RedisRateLimiter();         // across servers; uses the `redis` section

$app->middleware(new SecurityHeaders(), new AccessLog($app->logger(), ['/health/live']));
$app->group('/api', function ($r) use ($limiter) {
    $r->get('/orders', OrdersController::class . '::index')->middleware(Authorize::ability('orders.read'));
    $r->post('/orders', OrdersController::class . '::store')->middleware(new RateLimit($limiter, 30, 60));
}, [$auth]);
```

| Middleware | Behaviour |
|---|---|
| `BearerTokenAuth` | resolves `Authorization: Bearer` via your callback; stores the `Identity` on the request (request-scoped); 401 + `WWW-Authenticate` otherwise; `optional: true` lets anonymous requests through |
| `Authorize` | `Authorize::ability('x')` or a custom `fn (Identity, Request): bool`; 401 without identity, 403 when denied |
| `RateLimit` | fixed window per identity (or client address, or a custom key); `X-RateLimit-*` headers; 429 + `Retry-After`; fails open (and reports) when the backend is down |
| `SecurityHeaders` | `nosniff`, `DENY` framing, `no-referrer`, restrictive CSP, CORP, `no-store`, optional HSTS; never overrides headers the handler set |
| `AccessLog` | one JSON line per request (method, route pattern, path, status, duration, request id, address); no query strings, headers or bodies |

Identities are request-scoped: concurrent requests with distinct tokens on the same worker
each see only their own identity.

## Checklist

- `APP_DEBUG=false` and `APP_ENV=production` in production.
- Secrets (database, Redis, tokens) only in the environment, never in the repository.
- TLS verification of the HTTP client left on (it is on by default).
- `/metrics` protected by a token or reachable only from the internal network.
- Rate limits on authentication and other expensive endpoints.
- Validate every request body with `$request->validate()`; models only accept `$fillable`
  attributes from `create()` and `fill()`.

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

## Named rate limiters

Define limiters once in `bootstrap.php` and apply them by name. A limiter returns one limit, a
list of limits (all must pass), or `null` for no limit:

```php
use Omnitrix\RateLimit\{Limit, Throttle};

$app->rateLimiter('api', fn (Request $r) => Limit::perMinute(60)->by(BearerTokenAuth::identity($r)?->id ?? $r->remoteAddress() ?? ''));
$app->rateLimiter('login', fn (Request $r) => [
    Limit::perMinute(5)->by((string) $r->input('email')),
    Limit::perHour(100)->by($r->remoteAddress() ?? '')->response(fn (Request $r, $result) => Response::json(['error' => 'slow down'], 429)),
]);

$router->post('/login', [AuthController::class, 'login'])->middleware(Throttle::using('login'));
```

Without `by()` a limit counts per identity, then per client address. A request rejected by one
limit is not counted by the others. The backend is shared memory for one server, or Redis across
servers (`config/rate_limit.php`; Redis by default when it is configured).

Limit anything else directly:

```php
use Omnitrix\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('otp:' . $phone, 3, 600)) {
    return Response::json(['retry_in' => RateLimiter::availableIn('otp:' . $phone, 600)], 429);
}
RateLimiter::hit('otp:' . $phone, 3, 600);
RateLimiter::attempt('report:' . $userId, 1, fn () => $reports->build($userId), 3600); // false when over the limit
RateLimiter::clear('otp:' . $phone, 600);
```

## Hashing

`Hash` hashes passwords with bcrypt (default) or argon2id, configured in `config/hashing.php`:

```php
use Omnitrix\Facades\Hash;

$user->password = Hash::make($input['password']);

if (Hash::check($input['password'], $user->password)) {
    if (Hash::needsRehash($user->password)) {      // settings or driver changed since it was stored
        $user->update(['password' => Hash::make($input['password'])]);
    }
}
```

`check()` accepts bcrypt and argon2id hashes whatever the current driver, so switching drivers
keeps existing passwords valid. Hashing is deliberate CPU work (about 50–250 ms at the defaults)
and holds the worker meanwhile; keep `rounds`/`memory` at values your login rate can afford.

## Encryption

`Crypt` encrypts with AES-256-GCM and the application key. Set the key once per environment:

```bash
php omnitrix key:generate        # writes APP_KEY=base64:… into .env (keeps an existing key unless --force)
php omnitrix key:generate --show # prints a key, for secret stores
```

```php
use Omnitrix\Encryption\DecryptException;
use Omnitrix\Facades\Crypt;

$token = Crypt::encrypt(['user' => 10, 'scope' => 'export']); // any JSON value
try {
    $data = Crypt::decrypt($token);
} catch (DecryptException) {
    // changed, truncated, or encrypted with a key this application does not know
}
$secret = Crypt::encryptString('plain text');
```

Payloads are URL-safe and authenticated: any change is rejected. Each payload names the key that
encrypted it, so a key can be rotated without breaking existing data — set the new `APP_KEY` and
list the old one in `app.previous_keys` until data encrypted with it has expired.

## Checklist

- `APP_DEBUG=false` and `APP_ENV=production` in production.
- Secrets (database, Redis, tokens, `APP_KEY`) only in the environment, never in the repository.
- TLS verification of the HTTP client left on (it is on by default).
- `/metrics` protected by a token or reachable only from the internal network.
- Rate limits on authentication and other expensive endpoints.
- Validate every request body with `$request->validate()`; models only accept `$fillable`
  attributes from `create()` and `fill()`.

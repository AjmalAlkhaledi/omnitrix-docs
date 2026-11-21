---
sidebar_position: 10
---

# Authentication

`config/auth.php` defines guards — how a request is authenticated — and the user model:

```php
return [
    'default' => 'api',
    'guards' => [
        'api' => ['driver' => 'token', 'provider' => 'users'],     // Authorization: Bearer …
        'web' => ['driver' => 'session', 'provider' => 'users'],   // browser clients, with sessions
    ],
    'providers' => ['users' => ['model' => App\Models\User::class]],
];
```

The user model implements `Omnitrix\Contracts\Authenticatable` with the `Authenticatable` trait
(`password` and `remember_token` columns), and hashes passwords with the `hashed` cast:

```php
final class User extends Model implements AuthenticatableContract
{
    use Authenticatable;
    use HasApiTokens;

    protected static array $hidden = ['password', 'remember_token'];
    protected static array $casts = ['password' => 'hashed'];
}
```

Protect routes with `Authenticate` (401 without a user); several guards may be listed, the first
that authenticates wins:

```php
use Omnitrix\Auth\Authenticate;

$router->group('/api', function ($r) { /* … */ }, [Authenticate::using('api')]);
```

```php
use Omnitrix\Facades\Auth;

Auth::user();            // the authenticated user (default guard), or null
Auth::id();
Auth::check();
Auth::authenticate();    // the user, or a 401 error
Auth::guard('web')->user();
```

## API tokens

```php
// issue a token (for example after checking the password with Auth::validate())
$token = $user->createToken('mobile', ['orders.read', 'orders.write'], new DateTimeImmutable('+90 days'));
return ['token' => $token->plainTextToken];          // "12|8f0c…" — shown once

// in a request authenticated by the token
Auth::token()?->can('orders.write');
$user->tokenCan('orders.write');
$user->tokens()->where('name', 'mobile')->delete();   // revoke
```

Tokens are stored as SHA-256 hashes in `personal_access_tokens` (migration included in the
template); expired tokens are rejected and `last_used_at` is kept current. A token's abilities
become the request's `Identity`, so `Authorize::ability('orders.write')` and rate limiting use them.

## Session login

For browser clients, with `StartSession` (and usually `VerifyCsrfToken`) on the routes:

```php
if (!Auth::attempt(['email' => $email, 'password' => $password], remember: true)) {
    return Response::json(['error' => 'Invalid credentials'], 422);
}
Auth::logout();
```

`attempt()` regenerates the session id (against session fixation). `remember: true` sets a
long-lived cookie that logs the user in again after the session expired; its token is stored
hashed and revoked by `logout()`. Passwords stored with outdated hashing settings are re-hashed
after a successful login.

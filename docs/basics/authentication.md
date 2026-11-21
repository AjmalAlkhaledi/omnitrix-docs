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

## E-mail verification

Users implementing `Omnitrix\Contracts\MustVerifyEmail` (trait
`Omnitrix\Auth\Verification\MustVerifyEmail`, column `email_verified_at`) confirm their address
through a signed link:

```php
// routes/api.php
AuthRoutes::verification($router);        // GET email/verify/{id}/{hash} (signed), POST email/verification-notification

// after registration
$user->sendEmailVerificationNotification();

// routes only for verified users
$router->get('/orders', …)->middleware(Authenticate::using('api'), new EnsureEmailIsVerified());
```

The link expires after an hour (`VerifyEmail::$expireMinutes`) and contains a hash of the address,
so it stops working when the address changes. Opening it needs no login — the signature proves it
came from the e-mail. Resending needs a login and is limited to 6 a minute. A successful
verification dispatches `Omnitrix\Auth\Events\Verified`.

## Password reset

```php
AuthRoutes::passwordReset($router);       // POST forgot-password {email}, POST reset-password {email, token, password}
```

`forgot-password` e-mails a link built from `auth.passwords.url` (`{token}` and `{email}` are
filled in — point it at your frontend) and answers the same whether or not the address has an
account. Tokens are stored as HMAC hashes, one per address, expire after `expire` minutes and can
be used once; new links for an address wait `throttle` seconds. `reset-password` sets the new
password (hashed by the `hashed` cast), revokes the remember token and dispatches
`Omnitrix\Auth\Events\PasswordReset`. The broker is also available directly:

```php
$status = Password::sendResetLink(['email' => $email]);   // Password::RESET_LINK_SENT, INVALID_USER, RESET_THROTTLED
$status = Password::reset($data, function (User $user, string $password): void {
    $user->update(['password' => $password]);
});                                                         // Password::PASSWORD_RESET, INVALID_TOKEN, INVALID_USER
```


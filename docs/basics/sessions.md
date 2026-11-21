---
sidebar_position: 9
---

# Sessions and CSRF

APIs authenticated with tokens need neither. For browser clients (a single-page application on
the same site, server-rendered forms) add sessions and CSRF protection to the routes that need
them:

```php
use Omnitrix\Http\Middleware\EncryptCookies;
use Omnitrix\Security\VerifyCsrfToken;
use Omnitrix\Session\StartSession;

$app->group('/web', function ($r) { /* … */ }, [new EncryptCookies(), new StartSession(), new VerifyCsrfToken(except: ['webhooks/*'])]);
```

## Using the session

```php
use Omnitrix\Facades\Session;

Session::put('cart', $items);
Session::get('cart', []);
Session::push('viewed', $productId);
Session::pull('cart');                 // read and remove
Session::flash('status', 'Saved');     // available in the next request only (reflash() keeps it once more)
Session::regenerate();                 // new id after login (prevents session fixation)
Session::invalidate();                 // logout: data removed, new id
```

`config/session.php` chooses the driver: `redis` (the cookie holds a random id; default when Redis
is configured), `cookie` (the data itself, encrypted with `APP_KEY`, up to about 4 KB) or `array`
(tests). A request that never touches the session sends no cookie. Set `secure` to true behind
HTTPS.

## CSRF protection

`VerifyCsrfToken` answers `419` to POST, PUT, PATCH and DELETE requests that do not carry the
session's token as a `_token` field or an `X-CSRF-TOKEN` / `X-XSRF-TOKEN` header. Every response
sets an `XSRF-TOKEN` cookie that JavaScript can read and send back as `X-XSRF-TOKEN` (many HTTP
clients do this on their own). Requests with an `Authorization: Bearer` header are not checked —
browsers never add that header by themselves, so such requests cannot be forged from another
site.

## Encrypted cookies

`EncryptCookies` encrypts every cookie the application sets and decrypts incoming ones, so clients
can neither read nor change them; a cookie that does not decrypt is ignored. Pass the names that
must stay readable: `new EncryptCookies(['locale'])`.

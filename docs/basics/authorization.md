---
sidebar_position: 11
---

# Authorization

Authorization decides what an authenticated user may do. Define **abilities** for actions that
are not about one model, and **policies** for models — in `bootstrap.php` (every worker):

```php
$app->define('reports.view', fn (User $user) => $user->is_admin);
$app->policy(Post::class, PostPolicy::class);       // or 'policies' in config/auth.php
```

```php
final class PostPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->is_admin ? true : null;           // null: let the method decide
    }

    public function viewAny(?User $user): bool          // nullable: guests are asked too
    {
        return true;
    }

    public function update(User $user, Post $post): AuthorizationResponse
    {
        return $user->id === $post->user_id
            ? AuthorizationResponse::allow()
            : AuthorizationResponse::deny('You do not own this post');
    }

    public function create(User $user): bool
    {
        return $user->email_verified_at !== null;
    }
}
```

Policy methods are named after the ability (`update`, `viewAny`; `force-delete` → `forceDelete`).
A guest is passed only to callbacks whose user parameter is nullable; otherwise guests are
denied. `AuthorizationResponse::denyAsNotFound()` answers 404, hiding that the resource exists.

## Checking

```php
use Omnitrix\Facades\Gate;

Gate::allows('update', $post);
Gate::denies('reports.view');
Gate::authorize('update', $post);       // AuthorizationException: 403 with the policy's message
Gate::inspect('update', $post)->message;
Gate::forUser($other)->allows('update', $post);
$user->can('update', $post);            // user models with the Authorizable trait
```

In routes, after `Authenticate`:

```php
use Omnitrix\Auth\Access\Can;

$router->put('/posts/{id:\d+}', [PostController::class, 'update'])
    ->middleware(Can::ability('update', fn (Request $r) => Post::findOrFail($r->routeInt('id'))));
$router->post('/posts', [PostController::class, 'store'])->middleware(Can::ability('create', Post::class));
```

Global hooks run around every check: `Gate::gate()->before(fn (User $u) => $u->is_admin ? true : null)`
decides when it returns non-null; `after()` hooks see the result and may supply one when none was
given. For token-based requests, `Authorize::ability('orders.write')` checks the token's
abilities instead (see Security).

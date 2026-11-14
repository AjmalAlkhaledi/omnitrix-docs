---
slug: /
sidebar_position: 1
---

# Omnitrix

Omnitrix is a PHP framework for building HTTP APIs on [OpenSwoole](https://openswoole.com/).
Your application runs as a long-lived server: every request is handled in its own coroutine,
and database queries, Redis commands, outbound HTTP calls and file access suspend only the
request that is waiting. A few worker processes therefore serve many concurrent requests, and
independent I/O inside one request can run in parallel.

```php
// routes/api.php
$router->get('/users/{id:\d+}', function (Request $request): array {
    $user = User::with('posts')->findOrFail($request->routeInt('id'));

    return Async::all([
        'user' => fn () => $user,
        'followers' => fn () => DB::table('follows')->where('user_id', $user->id)->count(),
        'score' => fn () => Http::timeout(2)->get("https://scores.example.com/users/{$user->id}")->json(),
    ], timeout: 3.0);
});
```

## What you get

- **A ready-to-run application**: `omnitrix new my-api` (or `composer create-project omnitrix/omnitrix my-api`)
  creates a project with configuration, routes, models, migrations, seeders, a queue job and tests.
- **A command line**: `php omnitrix serve`, `migrate`, `db:seed`, `queue:work`, `routes`, and
  generators for controllers, models, migrations, middleware, jobs and seeders.
- **HTTP**: routing with groups and named routes, middleware, validation, JSON errors with
  request ids, streaming, body limits and request timeouts.
- **Database**: pooled MySQL/MariaDB connections, a query builder, schema migrations, and models
  with `hasOne`, `hasMany`, `belongsTo` and `belongsToMany` relationships and eager loading.
- **Concurrency**: `Async::all`, `race`, `withTimeout` and scopes with cancellation; an HTTP
  client, Redis, cache and queue built for coroutines; a CPU process pool for heavy computation.
- **Production**: authentication, authorization, rate limiting, security headers, access logs,
  Prometheus metrics, health checks, graceful shutdown and zero-downtime reloads.

## Packages

| Package | Role |
|---|---|
| `omnitrix/omnitrix` | The application template you install and own |
| `omnitrix/core` | All framework logic (the framework and its runtime engine), installed in `vendor/` |
| `omnitrix/installer` | The optional `omnitrix new` command |

Your code lives in the application; the framework is updated with `composer update omnitrix/core`. See [Architecture](architecture/overview.md).

## Next steps

1. [Install](getting-started/installation.md) the requirements and create a project.
2. Build [your first API](getting-started/first-api.md) with a model, a migration and a controller.
3. Read about [concurrency](async/concurrency.md) — the main difference from request-per-process PHP.

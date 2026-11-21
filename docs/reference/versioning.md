---
sidebar_position: 2
---

# Versioning and upgrades

Omnitrix follows [Semantic Versioning](https://semver.org/). While the version is `0.x`, the
**minor** number plays the role of the major one:

| Release | Example | May contain |
|---|---|---|
| Patch | `0.2.0` → `0.2.1` | bug and security fixes only; no new configuration, no behaviour change you have to act on |
| Minor | `0.2.x` → `0.3.0` | new features **and** breaking changes, each listed under *Upgrading* below and in the changelog |
| Major | `1.0.0` | from 1.0 on, breaking changes only in major releases |

Require the framework with a caret constraint, such as `"omnitrix/core": "^0.3"`. Composer then
installs patches automatically and never a new minor version, so an application is never
upgraded across a breaking change by `composer update`. The application template pins the minor
version it was written for.

## What is covered

The public API is everything an application uses:

- classes, interfaces, methods and constants in the `Omnitrix\` namespace that are not marked
  `@internal`;
- configuration keys in `config/*.php` and environment variables;
- console commands and their options;
- HTTP behaviour the framework defines: status codes, error body shape, headers;
- metric names and labels in `/metrics`;
- the database schema the framework creates (migrations table, queue keys, cache keys format).

The engine (`Omnitrix\Core\`) is public too, but extension points there (drivers, transports)
may change in a minor release when a feature needs it; such changes are listed like any other.
Anything marked `@internal`, test helpers, and the exact text of log and exception messages are
not covered.

## Support

| Version | Status |
|---|---|
| latest minor | bug and security fixes |
| previous minor | security fixes for six months after the next minor is released |
| older | unsupported |

## Deprecations

A feature that will be removed is first deprecated in a minor release: it keeps working, the
docs and changelog say what replaces it, and it is removed no earlier than the next minor
release.

## Upgrading

### 0.2 → 0.3

Update the constraint to `"omnitrix/core": "^0.3"`.


- `/metrics`: per-worker values (`omnitrix_worker_coroutines`, `omnitrix_event_loop_lag_*`,
  `omnitrix_worker_memory_bytes`) carry a `worker` label, and pool and cache statistics of every
  worker are reported, not only those of the worker that served the scrape. Update dashboards
  that queried these series without a label.
- A request that fails because a database, Redis or connection pool is unavailable answers
  `503 Service Unavailable` with `Retry-After: 1` instead of `500`. Alerts that counted these
  failures as 500 should include 503.
- Row cache keys are tagged per table (`{conn:table}:pk:v` instead of `{conn:table:pk}:v`) so the
  cache works on a Redis Cluster: after the upgrade the cache starts empty and fills again.
- Closures passed to `Redis::withConnection()`, `pipeline()` and `transaction()` receive
  `Redis|RedisCluster`; closures typed `Redis` still run against a single server, but static
  analysis asks for the union.
- Applications made from the 0.2 template keep working unchanged: the new features are opt-in.
  To use authentication, e-mail verification and password reset, copy the template's 0.3
  migrations (`users.password`, `email_verified_at`, `remember_token`, `personal_access_tokens`,
  `notifications`, `password_reset_tokens`) and its `config/` files, then run
  `php omnitrix key:generate`. The 0.3 template's `POST /api/users` requires a password.

### 0.1 → 0.2

Nothing to change: the row and query cache are off until `cache` is added to a database
connection. Update the constraint to `"omnitrix/core": "^0.2"`.

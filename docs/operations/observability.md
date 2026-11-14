---
sidebar_position: 2
---

# Observability

Register metrics and health endpoints in `bootstrap.php`. The skeleton enables `/health` by
default.

```php
use Omnitrix\Config\Env;
use Omnitrix\Security\BearerTokenAuth;
use Omnitrix\Security\Identity;

$app->enableMetrics('/metrics', [
    new BearerTokenAuth(fn (string $t): ?Identity => hash_equals(Env::required('METRICS_TOKEN'), $t) ? new Identity('prometheus') : null),
]);
$app->health('/health');   // /health/live and /health/ready (database and Redis checks when configured)
```

- Request counters and latency histograms are kept in shared memory, so any worker serves
  server-wide numbers in Prometheus text format. Labels: route pattern (never the raw path),
  method, status.
- Gauges: connections, requests, coroutines, event-loop lag (current/max/avg), worker memory,
  idle workers, and the serving worker's database, Redis and HTTP client pool statistics.
- Readiness runs all checks concurrently with a timeout (default 2 s); failures report the
  exception class only. Add your own checks with `health('/health', ['search' => fn (): bool => ...])`.

## Logging

The default logger writes one JSON object per line to stderr, at `app.log_level` and above.
`$app->logger()` returns it; pass any PSR-3 logger to `Application::create($config, $logger)` in
`bootstrap.php` to replace it. To log to a file:

```php
use Omnitrix\Core\Log\JsonLogger;

$app = Application::create($config, new JsonLogger(fopen('/var/log/api/app.log', 'ab')));
```

Point logs at a file or a collector that always drains them: a stderr pipe that nobody reads
blocks workers once the pipe buffer (typically 64 KiB) is full.
## Access logs

```php
use Omnitrix\Observability\AccessLog;

$app->middleware(new AccessLog($app->logger(), skipPaths: ['/health/live']));
```

One JSON line per request: method, route pattern, path, status, duration, request id and client
address. Query strings, headers and bodies are never logged.

## Request ids

Every response carries `X-Request-Id`, and error bodies include `request_id`. Log lines written
while handling a request contain the same id, so a client-visible error can be traced to the log.
Read it in code with `$request->id()`.

---
sidebar_position: 4
---

# Maintenance mode

Take the API down while you migrate or deploy, without stopping the server:

```bash
php omnitrix down --message="Upgrading the database" --retry=120 --with-secret
#  [OK] The application is down for maintenance.
#  Bypass with the header: X-Maintenance-Bypass: 5f0c…
php omnitrix migrate
php omnitrix up
```

While down, every request — known paths and unknown ones — gets:

```http
HTTP/1.1 503 Service Unavailable
Retry-After: 120
Cache-Control: no-store

{"error":"Service Unavailable","message":"Upgrading the database"}
```

except:

- the `except` paths of `app.maintenance` — by default `/health/*` and `/metrics`, so load
  balancers keep the server and monitoring keeps working;
- requests with `X-Maintenance-Bypass: <secret>` (`--secret=…` or `--with-secret`), to check the
  deployment before opening it;
- client IPs given with `--allow=203.0.113.7` (repeatable; the direct peer address, so behind a
  proxy use the secret instead).

`queue:work` takes no new jobs while the application is down (jobs already running finish) and
continues after `up`; start it with `--force` to keep processing.

## One server or many

```php
// config/app.php
'maintenance' => [
    'driver' => 'file',                                  // or 'redis'
    'path' => __DIR__ . '/../storage/framework/down',
    'except' => ['/health/*', '/metrics'],
],
```

The `file` driver takes down the server whose files it writes. With several servers use
`redis`: one `php omnitrix down` takes all of them down. Every worker reads the state at most
once per second, so `down` and `up` take effect within about a second, at no measurable cost
per request.

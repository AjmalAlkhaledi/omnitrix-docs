# Deployment

## Process layout

One `php omnitrix serve` per host (or container) starts the OpenSwoole master, a manager, N HTTP
workers and optional CPU-pool processes. Run it under a supervisor
(systemd, s6, Kubernetes) that sends **SIGTERM** to stop and **SIGUSR1** to reload code.

```ini
# /etc/systemd/system/omnitrix-api.service
[Service]
WorkingDirectory=/srv/api
ExecStart=/usr/bin/php omnitrix serve
ExecReload=/bin/kill -USR1 $MAINPID
KillSignal=SIGTERM
TimeoutStopSec=30
Restart=always
User=api
EnvironmentFile=/etc/omnitrix-api.env
LimitNOFILE=65536
```

## Sizing

- `server.workers`: number of cores available to the API (I/O-bound code needs no more).
- `database.pool.max` is **per worker**: total connections = workers × max. Keep the sum below
  the database's `max_connections` across all API hosts.
- `server.max_coroutine` bounds in-flight requests per worker (503 above it).
- `http_client.max_concurrent` and `pool.max_per_host` bound outbound fan-out.
- CPU pool: one process per core you can spare for CPU jobs.

## Shutdown and reload

- Default `server.mode = process` drains in-flight requests on SIGTERM (bounded by
  `max_wait_time`), then closes pools in `WorkerStop`. Set the supervisor timeout above
  `max_wait_time`.
- SIGUSR1 replaces workers one by one with new code; OPCache with `validate_timestamps=0`
  needs a reload (or restart) to pick up new files.

## Reverse proxy (optional)

Nginx in front terminates TLS and buffers slow clients:

```nginx
upstream omnitrix { server 127.0.0.1:8080; keepalive 256; }
server {
    listen 443 ssl http2;
    client_max_body_size 1m;          # match http.max_body_size
    location / {
        proxy_pass http://omnitrix;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 35s;        # above http.request_timeout
    }
}
```

Behind a proxy, `Request::remoteAddress()` is the proxy; give `RateLimit` a key function
that reads a trusted forwarded header.

## Kernel limits

Raise `net.core.somaxconn` and `tcp_max_syn_backlog` (≥ 4096) and the open-file limit. Small
values show up as 1 s SYN retransmits under bursts of new connections.

## Logging

Write logs to a file or a collector that always reads; never leave stderr connected to a pipe
nobody drains (a full pipe blocks workers). Set `server.log_file` for OpenSwoole's own log.

## Queue workers

Run `php omnitrix queue:work` as separate supervised processes (see [Queues](../async/queues.md));
they stop gracefully on SIGTERM. Use a stop timeout above the queue's job timeout.

```ini
# /etc/systemd/system/omnitrix-worker@.service  (systemctl start omnitrix-worker@1 …)
[Service]
WorkingDirectory=/srv/api
ExecStart=/usr/bin/php omnitrix queue:work
KillSignal=SIGTERM
TimeoutStopSec=90
Restart=always
User=api
EnvironmentFile=/etc/omnitrix-api.env
```

## Releasing a new version

```sh
composer install --no-dev --optimize-autoloader
php omnitrix migrate            # only migrate:fresh, migrate:reset, rollback and db:seed need --force in production
systemctl reload omnitrix-api   # SIGUSR1: workers are replaced one by one
systemctl restart 'omnitrix-worker@*'
```

## Checklist

- `debug => false`; secrets only from the environment; TLS verification left on.
- `/metrics` protected (token middleware) or reachable only internally.
- `/health/live` for liveness, `/health/ready` for readiness/load-balancer checks.
- Database user with least privilege; `statement_timeout` set.
- Supervisor stop timeout > `max_wait_time`; file descriptor limit raised.

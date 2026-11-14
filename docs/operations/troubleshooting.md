# Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `io_uring` warnings for file operations in stderr | kernel < 5.1; OpenSwoole retries its io_uring file engine | set `server.log_file` or `server.log_level => 'error'` (file I/O still works via the thread pool) |
| `Unable to create event-loop reactor` | `reactor => 'io_uring'` on an old kernel | Omnitrix refuses this at config time; use `epoll` |
| Requests hang after some traffic, workers idle | worker blocked writing to a full stderr pipe | log to a file / a drained collector |
| `Socket#N has already been bound to another coroutine` | one connection used by two coroutines | never share clients; use the pools (`OwnershipViolationException` catches this early) |
| `API must be called in the coroutine` at shutdown | coroutine APIs used in `WorkerStop` | Omnitrix pools handle this; custom resources must not use channels/sockets in stop hooks |
| `Co::sleep(0.5)` returns immediately | OpenSwoole 26.2 truncates to int | use `Async::sleep(0.5)` |
| `must be forked outside the coroutine` | `Process::start()` inside a request | use the CPU pool (`$app->cpu()`) |
| A standalone script never exits after `Coroutine::run()` | a pool timer is still armed | close clients you created before returning |
| 1 s latency spikes on bursts of new connections | listen backlog (`somaxconn`) too small | raise kernel limits; use keep-alive |
| `PoolExhaustedException` / `TimeoutException` from pools | more concurrent work than `pool.max` | raise the pool, bound fan-out (`Async::all(..., concurrency:)`), or shed load |
| `TlsException` calling an internal service | private CA | `->withCaFile('/etc/ssl/internal-ca.pem')` or `http_client.ca_file` |
| `DnsException` for public hosts in containers | resolver not reachable | check `/etc/resolv.conf`; OpenSwoole uses c-ares with that config |

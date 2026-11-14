# Platform Notes

Behaviour of OpenSwoole 26.2, PHP 8.5 and the extensions Core builds on that shaped the
implementation. Each item names the Core component that accounts for it. The integration
suite covers these behaviours, so a regression in a newer runtime version shows up as a test
failure.

## Coroutines and timers

- `Coroutine::sleep()` and `Coroutine\System::sleep()` declare an `int` parameter; fractional
  seconds truncate (0.5 → no wait). → `Runtime\Coroutine\Sleep::for(float)` uses a timer.
- `Channel::pop()`/`push()` timeouts below one millisecond round to zero and become
  indefinite waits. → pools check `isEmpty()`/`isFull()` before non-blocking operations.
- An uncaught exception in an OpenSwoole coroutine is fatal for the worker process.
  → `Coroutines::spawn()` contains failures and reports them.
- `Timer::clear()`/`exists()` arginfo declares no parameters although the id is required.
  → `Runtime\Coroutine\Timers` wraps them.
- The fiber context backend (`use_fiber_context`) makes coroutine creation orders of magnitude
  slower than the default backend. → not enabled.

## Server lifecycle

- On SIGTERM, POOL mode keeps connections of suspended requests open until their handlers
  finish; SIMPLE mode exits the worker's event loop immediately and closes them. Reload
  (SIGUSR1) drains in both modes. → POOL mode is the default.
- A worker receives requests as soon as its `WorkerStart` callback suspends on I/O.
  → services are registered before any warm-up that yields; pools create connections lazily.
- `WorkerStop` runs outside a coroutine; channel and socket APIs fail there.
  → pools track live connections in arrays and close them synchronously.
- Signal handlers cannot be installed in server workers (OpenSwoole owns them).
  → `Runtime\Shutdown\SignalHandler` is for standalone coroutine programs only.
- Processes cannot be forked inside a coroutine. → the CPU pool uses `Server::addProcess()`.
- The io_uring reactor aborts on kernels < 5.1 instead of falling back.
  → `RuntimeConfig` refuses `reactor => io_uring` there; epoll is the default.
- On kernels < 5.1 the io_uring *file* engine falls back to the thread pool but OpenSwoole may
  log warnings for every AIO batch. → set `log_file` or `log_level`.

## HTTP transport

- Above `package_max_length` the server answers `413` and closes the connection; oversized
  headers get `400`; a malformed request line closes the connection without a response.
- After a client disconnect `Response::write()` returns `false` while `isWritable()` still
  reports `true`. → `ResponseWriter` tracks write results (`clientGone()`).
- Once `write()` started chunked mode, the body passed to `end()` is discarded.
  → `ResponseWriter::end()` sends it as a final chunk.
- `OpenSwoole\Http\Request::create()->parse()` rejects lower-case methods.

## Outbound HTTP

- The native curl hook can crash the process when libcurl resolves remote host names itself,
  and does not reuse connections across `curl_exec()` calls. → `Coroutine\Http\Client`
  transport ([ADR-002](adr/async-io-strategy.md)).
- `Coroutine\Http\Client` does not verify TLS peers unless `ssl_verify_peer` is set, and needs
  `ssl_host_name` for SNI. → always set by the transport.
- The client does not follow redirects and buffers response bodies (`write_func` is not
  invoked for ordinary responses). → redirect policy and size limits are implemented in Core;
  `download()` streams to files.
- DNS failures surface as error code 711 (or similar resolver errors) → `DnsException`.

## Database

- Only mysqlnd-based `pdo_mysql` is coroutine-compatible; `pdo_pgsql` is not hooked.
- `PDO::ATTR_TIMEOUT` bounds connects but not reads under hooks. → server-side statement
  limits (`max_statement_time` on MariaDB, `max_execution_time` on MySQL).
- One PDO object used by two coroutines at once fails either with a catchable error or with a
  fatal "Socket#N has already been bound to another coroutine". → ownership assertions.
- A coroutine cancelled during a query leaves the connection unusable ("server has gone away"
  on next use). → the pool discards connections after interrupted operations.
- PHP 8.5 deprecates `PDO::MYSQL_ATTR_INIT_COMMAND`; with warnings promoted to exceptions this
  breaks connections. → session statements run with `exec()` after connecting.

## Redis

- phpredis reports server error replies by returning `false` (with `getLastError()`), not by
  throwing. → `RedisClient` converts them into `CommandException`.
- `OPT_PREFIX` also prefixes pub/sub channel names. → `subscribe()` strips it before invoking
  handlers.

## Static analysis

- `OpenSwoole\Process::alarm()` references `ITIMER_REAL`, which some builds without pcntl
  constants do not define; PHPStan's reflection then fails. → `tests/phpstan-bootstrap.php`
  defines the POSIX values for analysis only.

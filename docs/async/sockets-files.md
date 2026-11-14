# Sockets, DNS and Filesystem

Most applications never need this page: the database, Redis and HTTP client layers cover
typical I/O. For custom protocols and file work, Omnitrix Core ships coroutine-aware socket,
DNS and filesystem helpers in `Omnitrix\Core\IO`. They are stable, documented classes that
can be used directly from handlers, jobs and worker hooks. Every wait suspends only the
calling coroutine.

## What is non-blocking

| Operation | Mechanism | Non-blocking |
|---|---|---|
| TCP connect/send/receive (`TcpConnection`, `TcpServer`) | `Coroutine\Socket` | yes |
| UDP send/receive (`UdpSocket`) | `Coroutine\Socket` | yes |
| DNS (`Dns`) | c-ares (`Coroutine\System::getaddrinfo` / `dnsLookup`) | yes |
| Whole-file read/write (`Filesystem::read/write/append`) | `Coroutine\System::readFile/writeFile` (AIO thread pool) | yes |
| Chunked file streaming (`readChunks`, `writeChunks`) | hooked `fopen`/`fread`/`fwrite` (HOOK_FILE → thread pool) | yes |
| `file_exists`, `is_file`, `mkdir`, `rename`, `unlink` | direct syscalls | fast but blocking; avoid on network filesystems in request paths |
| io_uring file engine / reactor | requires kernel ≥ 5.1 | optional; without it the thread-pool fallback is used |

## Usage

```php
<?php

use Omnitrix\Core\IO\{Dns, Filesystem, TcpConnection, TcpServer, TempFiles, UdpSocket};

$c = TcpConnection::connect('cache.internal', 11211, timeout: 1.0);
$c->send("stats\r\n");
$line = $c->receiveLine(timeout: 1.0);
$c->close();

$server = new TcpServer('0.0.0.0', 9000, $app->exceptionHandler(), maxConnections: 1000);
// in its own coroutine:
$server->serve(function (TcpConnection $conn): void { $conn->send($conn->receiveLine()); });

$fs = new Filesystem();
$fs->write('/var/app/report.json', $json);              // atomic (temp file + rename)
foreach ($fs->readChunks('/var/app/big.csv') as $chunk) { /* stream */ }

$temp = new TempFiles();
$upload = $temp->forRequest($request->context());       // removed when the request ends
```

Errors: `IoException` (base, carries errno as code), `IoTimeoutException`,
`ConnectionClosedException`.

## Notes

- On kernels < 5.1 OpenSwoole may log io_uring warnings for file operations; set
  `server.log_file` or `server.log_level` (`error`) to keep them out of stderr.
- `TcpServer` is for auxiliary protocols inside a worker or a standalone coroutine program;
  the HTTP server remains `OpenSwoole\Http\Server`.
- Temp file names carry 128 random bits; files are created with the process umask.

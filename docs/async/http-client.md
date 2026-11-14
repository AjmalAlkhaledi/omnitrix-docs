# HTTP Client

Outbound HTTP for calling external APIs from request handlers and jobs. Every network wait
suspends only the calling coroutine, connections are pooled per origin, TLS is verified by
default, and failures are typed.

```php
<?php

use Omnitrix\Facades\Http;

$response = Http::timeout(5)->withHeaders(['Authorization' => 'Bearer TOKEN'])->get('https://api.example.com/users');
$data = $response->json();

$created = Http::request()->withToken($token)->asJson(['name' => 'Ann'])->post('https://api.example.com/users')->throw();
```

## Engine

The transport is `OpenSwoole\Coroutine\Http\Client` (HTTP/1.1, keep-alive) and
`OpenSwoole\Coroutine\Http2\Client` (HTTP/2, one stream per pooled connection), chosen over the
native curl hook, which is unreliable with remote DNS resolution and does not reuse
connections. Behaviour encoded in the implementation:

- The extension does **not** verify TLS by default; Omnitrix always sets `ssl_verify_peer`
  and the SNI/hostname (`ssl_host_name`) for DNS names. Untrusted CA → `TlsException`.
- Separate connect/read/write timeouts are honoured; error codes map to typed exceptions
  (110 timeout, 111 refused, 104/-3 closed by peer, 711 DNS, 1014 TLS, 125 cancelled).
- Redirects are not followed by the extension; Omnitrix implements the policy.
- Response bodies are buffered (the extension ignores `write_func`); the size limit is enforced
  after the read; `download()` streams to a file without buffering.

## Configuration (`http_client` section, all optional)

| Key | Default | Meaning |
|---|---|---|
| `timeout` | 30.0 | seconds to wait for the response after sending |
| `connect_timeout` | 5.0 | TCP/TLS connect limit |
| `max_redirects` | 5 | 0 disables following |
| `max_response_size` | 16 MiB | `ResponseTooLargeException` above this; use `download()` for files |
| `verify_tls` | true | never disable globally; use `withoutTlsVerification()` per request for test endpoints |
| `ca_file` | null | PEM bundle for a private CA |
| `user_agent` | `Omnitrix/0.1` | |
| `retries` | 0 | retries of **idempotent** requests (GET/HEAD/OPTIONS/PUT/DELETE) on connection failures |
| `retry_on_timeout` | false | also retry idempotent requests on timeouts |
| `retry_base_delay_ms` | 50 | exponential backoff base with jitter, capped at 2 s |
| `max_concurrent` | 256 | in-flight outbound requests per worker (backpressure) |
| `pool.max_per_host` | 32 | connections per origin per worker |
| `pool.idle_timeout` | 60.0 | idle connection eviction |
| `pool.acquire_timeout` | 5.0 | wait for a pooled connection → `TimeoutException` |
| `http2` | false | default protocol (prior knowledge for http://, ALPN for https://) |

## Request builder

`withHeaders`, `withHeader`, `withToken`, `withBasicAuth`, `accept`, `withQuery`, `asJson`,
`asForm`, `withBody`, `timeout`, `connectTimeout`, `maxRedirects`/`withoutRedirecting`,
`maxResponseSize`, `withCaFile`, `withoutTlsVerification`, `retry`, `http2`,
`withCancellation`; terminal: `get/head/post/put/patch/delete/send(method, url)` and
`download(url, path)`.

## Response

Responses are `Omnitrix\Core\HttpClient\Response` objects:

`status()`, `ok()`, `failed()`, `clientError()`, `serverError()`, `throw()` (→
`RequestException` with the response), `header()`, `headers()`, `setCookies()`, `body()`,
`size()`, `json()`, `jsonObject()`, `url()` (after redirects), `redirectCount()`,
`elapsed()`, `protocol()`.

## Redirect policy

301/302/303/307/308 with `Location` are followed up to `max_redirects`; 303 (and 301/302 for
non-GET) switch to GET and drop the body; 307/308 keep method and body; `Authorization` and
`Cookie` are removed when the redirect changes scheme, host or port.

## Errors

All in `Omnitrix\Core\HttpClient\Exception`:

| Exception | Meaning |
|---|---|
| `ConnectionException` | refused, reset, closed before a complete response, partial body |
| `TimeoutException` | connect or response timeout; also pool acquisition timeout |
| `DnsException` | host could not be resolved |
| `TlsException` | handshake or certificate verification failed |
| `TooManyRedirectsException` | redirect chain exceeded the limit |
| `ResponseTooLargeException` | body exceeded `max_response_size` |
| `RequestException` | 4xx/5xx raised by `throw()` |
| `HttpClientException` | base class; also invalid JSON in `json()` |

Interrupted exchanges (cancelled coroutine, request deadline) release the connection as
unhealthy so the pool never hands out a socket in an unknown state.

## Current limitations

- Response streaming to memory callbacks is unavailable (extension limitation); use
  `download()` for large payloads.
- No cookie jar and no proxy support; HTTP/2 uses one stream per pooled connection
  (no cross-coroutine multiplexing).
- Request bodies are strings (no streaming uploads).

# Requests and Responses

Handlers receive an `Omnitrix\Http\Request` and return an `Omnitrix\Http\Response` (or an
array, `JsonSerializable`, string or `null`; see [routing.md](routing.md)).

## Configuration (`http` section)

| Key | Default | Meaning |
|---|---|---|
| `max_body_size` | 1 MiB | larger bodies get `413` before the handler runs; must not exceed `server.package_max_length` |
| `request_timeout` | 30.0 s | the client receives `503` + `Retry-After: 1` when the handler has not finished in time; 0 disables |
| `json_max_depth` | 64 | nesting limit for request JSON |
| `request_id_header` | `X-Request-Id` | response header carrying the request id; `null` omits it |
| `json_flags` | `JSON_UNESCAPED_SLASHES \| JSON_UNESCAPED_UNICODE` | default flags for JSON responses |

## Request

| Group | Methods |
|---|---|
| Identity | `id()` (request id), `context()` (see [runtime.md](../operations/runtime.md#request-context)) |
| Line | `method()`, `isMethod()`, `path()` (no query string), `queryString()`, `protocolVersion()`, `remoteAddress()` |
| Query | `query()`, `queryParam()` |
| Headers | `headers()` (lower-case names), `header()`, `hasHeader()`, `bearerToken()`, `cookies()`, `cookie()`, `contentType()`, `isJson()` |
| Body | `body()`, `json()` (decoded once, depth-limited, big integers as strings), `jsonObject()` (must be an object), `form()`, `files()` |
| Input | `input('field')` (JSON field → form field → query parameter), `all()`, `validate(array $rules)` |
| Routing | `route()`, `routeInt()`, `routeParams()`, `routeName()`, `routePattern()` |
| Attributes | `setAttribute()`, `attribute()`, `hasAttribute()`, `attributes()` — set by middleware, request-scoped |

Malformed JSON or a body of the wrong shape answers `400`.

## Response

```php
use Omnitrix\Http\Cookie;
use Omnitrix\Http\Response;

Response::json(['id' => 1], 201);
Response::text('pong');
Response::html('<h1>Hello</h1>');
Response::noContent();
Response::redirect('/login', 303);
Response::file('/srv/exports/report.csv', 'text/csv', downloadName: 'report.csv');   // sendfile

(new Response('raw body', 200, ['Content-Type' => 'application/xml']))
    ->header('Cache-Control', 'no-store')
    ->cookie(new Cookie('session', $token, expires: time() + 3600, secure: true));
```

`HEAD` requests send headers only, with the computed `Content-Length`.

### Streaming

```php
use Omnitrix\Facades\Async;
use Omnitrix\Facades\DB;
use Omnitrix\Http\Response;
use Omnitrix\Http\Stream;

// Producer callback: the response ends when the callback returns.
$app->get('/events', fn () => Response::stream(function (Stream $stream): void {
    for ($i = 0; $i < 10; $i++) {
        if (!$stream->write("data: {$i}\n\n")) {
            return;                         // client disconnected
        }
        Async::sleep(1.0);
    }
}, 200, 'text/event-stream'));

// Any iterable of strings, generators included.
$app->get('/export', fn () => Response::chunks((function (): Generator {
    foreach (DB::table('orders')->orderBy('id')->get() as $row) {
        yield json_encode($row) . "\n";
    }
})(), 200, 'application/x-ndjson'));
```

Chunks are sent with chunked transfer encoding as they are produced; nothing is buffered.
`Stream::write()` returns `false` once the client is gone; `clientGone()` and
`bytesWritten()` are also available.

## Errors

Throw an `Omnitrix\Http\Exception\HttpException` (or a subclass) to answer with an error:

```php
use Omnitrix\Http\Exception\HttpException;
use Omnitrix\Http\Exception\NotFoundException;

throw new NotFoundException('Order not found');
throw new HttpException(409, 'Order already shipped', ['Retry-After' => '30'], ['order_id' => 42]);
```

| Condition | Response |
|---|---|
| `HttpException` (subclasses: `BadRequestException`, `NotFoundException`, `MethodNotAllowedException`, `PayloadTooLargeException`, `UnsupportedMediaTypeException`, `ServiceUnavailableException`) | its status and headers, JSON `{"error":{"status","message",…details},"request_id"}`; 5xx are also logged |
| `ValidationException` (from `validate()`) | `422` with per-field messages |
| body over `max_body_size` | `413` with `max_body_size` in the details |
| handler exceeds `request_timeout` | `503`, `Retry-After: 1` |
| any other throwable | generic `500` (exception details only with `debug => true`), reported to the exception handler |
| error after streaming started | the stream is terminated (the status cannot change any more) |

Messages of `HttpException`s are sent to clients; all other messages are replaced by the
generic reason phrase. The request id in the body lets operators correlate a client-visible
error with the log line.

## Transport behaviour

- Status and headers are buffered until the first byte is sent; bodies are never buffered.
- Keep-alive and pipelining are handled by OpenSwoole; no `Server` header is sent.
- A malformed request line closes the connection; oversized headers answer `400`.
- Bodies above `server.package_max_length` are rejected by the parser with `413` and the
  connection is closed.

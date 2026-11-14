# Concurrency

Omnitrix runs every request in its own coroutine; inside a request you can fan out independent
I/O with structured concurrency primitives exposed through `Omnitrix\Facades\Async`.

```php
<?php

use Omnitrix\Core\Concurrency\TimeoutException;
use Omnitrix\Facades\Async;

$results = Async::all([
    'user'   => fn () => $users->find(10),              // any coroutine-compatible I/O
    'orders' => fn () => $orders->forUser(10),
    'remote' => fn () => $http->get('https://api.example.com/data')->json(),
], timeout: 2.0, concurrency: 8);

$user = $results['user'];                                 // keyed and ordered like the input
```

## Guarantees

- **Real overlap.** Each task runs in its own coroutine; waiting on hooked I/O, timers or
  channels suspends only that task. Three 300/200/100 ms tasks finish in ≈ 300 ms (tested).
- **Structured.** No task outlives the call that started it. `all`, `allSettled`, `race`,
  `withTimeout` and `scope` cancel whatever is still running and wait for it to unwind before
  returning or throwing.
- **Fail-fast.** `all()` observes tasks in completion order; the first failure cancels the
  siblings, waits for them, then rethrows the original exception.
- **Timeouts.** `timeout:` bounds the whole group; expiry cancels the tasks and throws
  `TimeoutException` (in `allSettled` the unfinished tasks are reported as cancelled outcomes).
- **Bounded.** `concurrency:` caps simultaneously running tasks with a semaphore.
- **Context.** Child tasks see the parent's request context (request id, deadline, attributes).

## API

| Call | Result |
|---|---|
| `Async::all(array $tasks, ?float $timeout, ?int $concurrency)` | `array` of results, keys/order as given; throws first failure |
| `Async::allSettled(...)` | `array<Outcome>`: `fulfilled`, `value`, `reason`, `cancelled`, `get()` |
| `Async::race(array $tasks, ?float $timeout)` | first *successful* result; failures are skipped; all failed → last failure |
| `Async::withTimeout(callable $body, float $timeout)` | the body's result or `TimeoutException` |
| `Async::scope(callable(TaskScope) $body, ?int $concurrency)` | spawn tasks freely; the scope is closed when the body returns or throws |
| `Async::sleep(float $seconds)` | cooperative sleep (cancellable) |

Task callables receive a `CancellationToken`; long loops should call `throwIfCancelled()`
at safe points.

## Cancellation model

A `CancellationToken` is cancelled explicitly (`cancel()`), by a timeout, by a failing
sibling, or because its parent token was cancelled. Cancelling:

1. flips the token permanently (`isCancelled()`), with an optional reason;
2. interrupts attached coroutines that are suspended in a cancellable operation — channel
   waits, `Async::sleep`, `usleep`, hooked sockets, PDO queries, HTTP connects (the operation
   returns an error within milliseconds). A coroutine busy on CPU is not interrupted; it sees
   the token at its next check;
3. runs `onCancel` callbacks and cancels child tokens.

Inside a cancelled task, interrupted library calls surface as their own errors (for example a
PDO exception); the task is nevertheless recorded as **cancelled**, and `Task::await()` throws
`CancelledException`. A connection that was interrupted mid-query must be discarded — the
database pool does this automatically.

## Tasks and scopes directly

```php
<?php

use Omnitrix\Core\Concurrency\TaskScope;
use Omnitrix\Facades\Async;

$summary = Async::scope(function (TaskScope $scope): array {
    $a = $scope->spawn(fn () => fetchA(), 'a');
    $b = $scope->spawn(fn () => fetchB(), 'b');
    $first = $scope->nextSettled();         // completion order
    $resultA = $a->await(timeout: 1.0);     // TimeoutException if not done in time (task keeps running)
    $b->cancel('not needed');

    return ['first' => $first?->key, 'a' => $resultA];
}, concurrency: 4);                          // anything still running is cancelled and awaited here
```

## Types

`TaskScope`, `Task`, `Outcome`, `CancellationToken`, `TimeoutException` and
`CancelledException` live in `Omnitrix\Core\Concurrency`. They are part of the public API
that `Async` returns and accepts; applications do not construct them directly.

## Implementation notes

- Settling is signalled through channels; no polling, no busy loops. The cost of `Async::all`
  with three tasks is three coroutines plus a handful of channel operations.
- Sleeps arm an OpenSwoole timer whose callback runs in a short-lived coroutine; code that
  counts live coroutines right after a sleep (diagnostics) should yield once first.

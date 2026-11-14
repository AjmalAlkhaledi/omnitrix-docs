# CPU Worker Pool

CPU-heavy work (report rendering, image processing, hashing, large JSON transforms) must not
run inside HTTP workers: a coroutine that computes never yields, so every other request on
that worker would wait. The CPU pool runs registered jobs in dedicated processes.

```php
<?php

use Omnitrix\Facades\Cpu;

$app->cpu(
    jobs: [
        'primes' => static function (array $args): array {
            $limit = (int) ($args['limit'] ?? 1000);
            // ... pure CPU work ...
            return ['count' => $count];
        },
    ],
    workers: 2,          // CPU processes
    timeout: 30.0,       // default per-job timeout in seconds (queueing included)
    maxPending: 64,      // jobs waiting per process before callers are rejected
);

$app->get('/report', fn () => Cpu::run('primes', ['limit' => 200000], timeout: 10));
```

Register the pool before `run()`. Jobs are plain callables that receive the JSON-decoded
arguments and return a JSON-compatible value.

## How it works

- `cpu()` adds `workers` processes to the server. The OpenSwoole manager supervises them and
  restarts any that exit. Processes cannot be forked from inside a coroutine, which is why
  the pool is part of the server rather than created on demand.
- Each CPU process listens on a private unix socket and executes one job at a time.
- `Cpu::run()` picks the least-loaded process through a shared-memory table, sends a
  length-prefixed JSON frame and waits cooperatively: the HTTP worker keeps serving other
  requests meanwhile.
- The CPU process acknowledges with its pid before running the job. On timeout after the
  acknowledgement the caller kills that process and the manager starts a new one; on timeout
  while still queued the request is abandoned and the job is skipped.
- Arguments and results must be JSON-compatible; nothing is `serialize()`d across the boundary.

## Errors

All in `Omnitrix\Core\Process`:

| Exception | Meaning |
|---|---|
| `CpuJobException` | the job threw; `remoteClass` holds the original class; the process survives |
| `CpuTimeoutException` | the job exceeded its timeout (process killed) or the pool is saturated (`maxPending`) |
| `WorkerCrashedException` | the process died during the job, or was restarting |

All extend `CpuException`; an unknown job name is reported as a `CpuJobException`.

## Guarantees covered by the test suite

Jobs run in a different process than the HTTP worker; while two long CPU jobs run in
parallel, HTTP latency on the same server is unaffected; job exceptions, unknown jobs,
timeouts and crashes are reported with typed errors and the pool recovers; graceful shutdown
exits cleanly and leaves no CPU process behind.

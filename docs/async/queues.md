---
sidebar_position: 4
---

# Queues

A Redis-backed job queue for work that should happen after the response (e-mails, webhooks,
reports) or must survive restarts. It uses the `redis` configuration.

## Defining a job

```bash
php omnitrix make:job SendWelcomeEmail
```

```php
<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\User;
use Omnitrix\Core\Queue\Job;
use Omnitrix\Config\Env;
use Omnitrix\Facades\Http;

final class SendWelcomeEmail
{
    /** @param array<string, mixed> $payload */
    public function handle(array $payload, Job $job): void
    {
        $user = User::find((int) $payload['user_id']);
        if ($user === null) {
            return;
        }
        Http::withToken(Env::required('MAIL_API_KEY'))->post('https://mail.example.com/send', [
            'to' => $user->email,
            'template' => 'welcome',
        ])->throw();
    }
}
```

Register the job name in `config/queue.php`:

```php
return [
    'queue' => 'default',
    'concurrency' => 4,     // jobs processed at the same time per worker process
    'timeout' => 60,        // seconds before a running job counts as failed
    'jobs' => [
        'users.welcome' => SendWelcomeEmail::class,
    ],
];
```

## Dispatching

```php
use Omnitrix\Facades\Queue;

$id = Queue::dispatch('users.welcome', ['user_id' => $user->id]);
Queue::dispatch('reports.render', ['month' => '2026-10'], delay: 300, queue: 'reports', maxAttempts: 5);
$stats = Queue::stats();   // ['ready' => …, 'delayed' => …, 'processing' => …, 'dead' => …]
```

Payloads are JSON: pass ids and scalars, not objects.

## Running workers

```bash
php omnitrix queue:work
php omnitrix queue:work --queue=reports --concurrency=8 --timeout=300
```

A worker is a separate long-running process. Handlers run in coroutines with the same facades as
request handlers (`DB`, models, `Http`, `Redis`, `Cache`, `Async`). Run several worker processes
to scale out; stop them with SIGTERM or Ctrl+C — they finish the jobs in progress first. See
[Deployment](../operations/deployment.md#queue-workers) for a systemd unit.

## Delivery guarantees

- **Durable**: jobs are stored in Redis before any worker runs.
- **At least once**: a job is moved atomically to the worker's processing list while it runs. If
  the worker dies, the job returns to the queue once the worker's heartbeat expires (30 s), so
  handlers must be **idempotent**.
- **Retries**: a job that throws or exceeds the timeout is retried with exponential backoff until
  `maxAttempts` (default 3); then it moves to the dead-letter list with its last error.
- **Unknown job names** and malformed messages go straight to the dead-letter list.
- **Delayed jobs** become available after their delay.

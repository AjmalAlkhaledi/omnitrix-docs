---
sidebar_position: 3
---

# Task scheduling

Define recurring tasks in `bootstrap.php` instead of one cron entry per task:

```php
use Omnitrix\Scheduling\Schedule;

$app->schedule(function (Schedule $schedule): void {
    $schedule->job('reports.build', ['period' => 'day'])->dailyAt('02:00')->onOneServer(); // queued, run by queue:work
    $schedule->call(fn () => Session::pruneExpired())->hourly()->description('prune sessions');
    $schedule->command('migrate:status')->weeklyOn(1, '08:00');                       // a console command
    $schedule->call(fn () => Billing::charge())->everyFiveMinutes()->withoutOverlapping()->timezone('Europe/Berlin');
});
```

Run the scheduler either way:

```bash
php omnitrix schedule:work       # long-running: runs the due tasks at the start of every minute
* * * * * cd /srv/api && php omnitrix schedule:run >> /dev/null 2>&1   # or from cron
php omnitrix schedule:list       # tasks with their next run
```

Due tasks run concurrently, each in its own coroutine with the facades available; a failing task
is logged (`scheduled task failed`) without affecting the others. Prefer `job()` for heavy work:
the scheduler only dispatches it and `queue:work` runs it with retries.

| Frequency | Cron |
|---|---|
| `everyMinute()`, `everyTwoMinutes()`, `everyFiveMinutes()`, `everyTenMinutes()`, `everyFifteenMinutes()`, `everyThirtyMinutes()` | `*/n * * * *` |
| `hourly()`, `hourlyAt(17)`, `everyTwoHours()` | `0 * * * *` … |
| `daily()`, `dailyAt('13:30')`, `twiceDaily(1, 13)` | `30 13 * * *` … |
| `weekly()`, `weeklyOn(1, '08:00')` (0 = Sunday), `weekdays()`, `weekends()` | `0 8 * * 1` … |
| `monthly()`, `monthlyOn(15, '09:00')`, `yearly()` | `0 9 15 * *` … |
| `cron('*/10 9-17 * * mon-fri')` | any five-field expression (lists, ranges, steps, names) |

| Option | Meaning |
|---|---|
| `timezone('Asia/Tokyo')` | interpret the times in this zone |
| `when(fn () => …)`, `skip(fn () => …)` | run only when / skip when the callback returns true |
| `withoutOverlapping($minutes)` | skip a run while the previous one is still going (Redis lock, expires after `$minutes`) |
| `onOneServer()` | with the scheduler running on several servers, only one runs the task each time (Redis) |
| `description('…')` | name shown in `schedule:list` and the logs |

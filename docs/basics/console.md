---
sidebar_position: 1
---

# Console

Every project has a command line: `php omnitrix`. Run `php omnitrix list` for all commands and
`php omnitrix help <command>` for the options of one.

## Running the application

| Command | What it does |
|---|---|
| `serve [--host=] [--port=] [--workers=]` | starts the HTTP server in the foreground; the options override `SERVER_HOST`, `SERVER_PORT`, `SERVER_WORKERS` |
| `queue:work [--queue=] [--concurrency=] [--timeout=]` | processes background jobs until SIGTERM/SIGINT ([Queues](../async/queues.md)) |
| `routes` | lists routes with methods, names, handlers and route middleware |
| `about` | versions of Omnitrix, PHP and the extensions, environment and configuration summary |

## Database

| Command | What it does |
|---|---|
| `migrate [--seed]` | runs pending migrations as one batch |
| `migrate:status` | lists migrations with whether and in which batch they ran |
| `migrate:rollback [--step=1]` | reverts the last batch (or the last N batches) |
| `migrate:reset` | reverts every migration |
| `migrate:fresh [--seed]` | drops **every table** of the database, then runs all migrations |
| `db:seed [--class=]` | runs `Database\Seeds\DatabaseSeeder` or the given seeder |

When `app.env` is `production`, `migrate:rollback`, `migrate:reset`, `migrate:fresh` and
`db:seed` refuse to run unless `--force` is given.

## Generators

| Command | Creates |
|---|---|
| `make:controller Name [--resource] [--model=Model]` | `src/Controllers/Name.php`; `--resource` adds index/show/store/update/destroy, `--model` implements them with the model |
| `make:model Name [--migration]` | `src/Models/Name.php` (and a `create_<table>_table` migration) |
| `make:migration name [--create=table] [--table=table]` | `database/migrations/<timestamp>_name.php`; `create_x_table` names imply `--create=x` |
| `make:middleware Name` | `src/Middleware/Name.php` |
| `make:job Name` | `src/Jobs/Name.php`, and prints the line to add to `config/queue.php` |
| `make:seeder Name` | `database/seeds/Name.php` |

Names may include sub-namespaces: `php omnitrix make:controller Admin/UserController` creates
`src/Controllers/Admin/UserController.php` in `App\Controllers\Admin`. Existing files are never
overwritten unless you pass `--force`.

## Writing your own commands

Commands extend `Omnitrix\Console\Command` (a Symfony Console command with access to the project)
and are registered in the `omnitrix` file:

```php
<?php
// src/Console/PruneTokensCommand.php

namespace App\Console;

use Omnitrix\Console\Command;
use Omnitrix\Facades\DB;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'tokens:prune', description: 'Delete expired API tokens')]
final class PruneTokensCommand extends Command
{
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $deleted = $this->app()->withServices(
            static fn (): int => DB::table('api_tokens')->where('expires_at', '<', date('Y-m-d H:i:s'))->delete(),
        );
        $output->writeln("Deleted {$deleted} tokens.");

        return self::SUCCESS;
    }
}
```

```php
// omnitrix
exit((new Console(__DIR__))->add(new App\Console\PruneTokensCommand())->run());
```

`$this->app()` is the application from `bootstrap.php`. `withServices()` runs a callback inside a
coroutine with the database, Redis, cache, queue and HTTP client facades available, exactly as
they are in request handlers.

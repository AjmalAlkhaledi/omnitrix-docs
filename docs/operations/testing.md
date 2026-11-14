---
sidebar_position: 4
---

# Testing

New projects include PHPUnit with two suites, `tests/Unit` and `tests/Feature`, and the
`vendor/bin/omnitrix-phpunit` runner:

```bash
composer test                     # or: vendor/bin/omnitrix-phpunit
vendor/bin/omnitrix-phpunit --testsuite unit
```

`omnitrix-phpunit` accepts every PHPUnit option. It runs the tests inside an OpenSwoole coroutine
with the runtime hooks enabled, so tests can use `Async`, the database, Redis and the HTTP
client exactly as handlers do.

## Unit tests with services

```php
use Omnitrix\Facades\Async;
use PHPUnit\Framework\TestCase;

final class PricingTest extends TestCase
{
    public function testQuotesAreFetchedConcurrently(): void
    {
        $start = microtime(true);
        $results = Async::all([
            'a' => static function (): int { Async::sleep(0.2); return 1; },
            'b' => static function (): int { Async::sleep(0.2); return 2; },
        ]);

        self::assertSame(['a' => 1, 'b' => 2], $results);
        self::assertLessThan(0.35, microtime(true) - $start);
    }
}
```

To use models and facades in a test, run the code inside the application's services:

```php
public function testCreatesUsers(): void
{
    $app = require __DIR__ . '/../../bootstrap.php';
    $app->withServices(function (): void {
        $user = User::create(['name' => 'Ann', 'email' => 'ann@example.com']);
        self::assertSame('Ann', User::findOrFail($user->id)->name);
    });
}
```

Point the tests at a separate database (for example with a `.env.testing` loaded in your test
bootstrap, or environment variables in `phpunit.xml`) and run `php omnitrix migrate:fresh` against
it before the suite.

## Feature tests against the real server

`tests/Feature/ServerTest.php` in the skeleton starts `php omnitrix serve` on a test port, sends
HTTP requests and stops the server with SIGTERM. Use the same pattern for end-to-end tests of your
routes:

```php
self::$server = proc_open([PHP_BINARY, $root . '/omnitrix', 'serve', '--port=18091', '--workers=1'], $descriptors, $pipes, $root);
// poll /health/live until it answers, then send requests
```

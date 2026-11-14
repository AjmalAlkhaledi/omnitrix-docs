---
sidebar_position: 100
---

# Contributing

Omnitrix is developed in separate repositories:

| Repository | Package | Contains |
|---|---|---|
| framework | `omnitrix/core` | the runtime engine |
| omnitrix-framework | `omnitrix/framework` | the framework |
| omnitrix | `omnitrix/omnitrix` | the application skeleton |
| installer | `omnitrix/installer` | the `omnitrix new` command |
| docs | — | this documentation site |

## Requirements

PHP 8.3+ with ext-openswoole 26.2+, ext-pdo_mysql (mysqlnd) and ext-redis 6.3+, Composer 2,
OpenSSL, and MariaDB 11+ and Redis 7+ binaries on the `PATH` for the integration tests.

## Running the test suites (Core and framework)

```bash
composer install
bin/services up        # MariaDB on 127.0.0.1:33306 and Redis on 127.0.0.1:63790, data in var/
make check             # composer validate/audit, coding standards, static analysis, all tests
bin/services down
```

`bin/services` starts both servers as unprivileged processes; no containers or root access are
needed. To use other servers, export the variables listed in `.env.example`.

| Target | |
|---|---|
| `make lint` / `make lint-fix` | PHP-CS-Fixer check / fix |
| `make stan` | PHPStan, level max with strict rules |
| `make test-unit`, `make test-integration`, `make test` | PHPUnit suites |

Tests run inside an OpenSwoole coroutine with runtime hooks enabled (`bin/co-phpunit` in Core,
`bin/omnitrix-phpunit` in the framework); do not run `vendor/bin/phpunit` directly.

## Developing packages together

To work on the framework against a local Core checkout (or on the skeleton against a local
framework), point Composer at the sibling directory without committing the change:

```bash
composer config repositories.omnitrix-core '{"type": "path", "url": "../framework", "options": {"symlink": true, "versions": {"omnitrix/core": "0.1.0"}}}'
composer update omnitrix/core
# ...
git checkout composer.json && composer update omnitrix/core
```

To try the full installation from local checkouts, pass the repositories to the installer; they
are added to the new project:

```bash
omnitrix new demo \
  --repository='{"type":"path","url":"../omnitrix","options":{"versions":{"omnitrix/omnitrix":"0.1.0"}}}' \
  --repository='{"type":"path","url":"../omnitrix-framework","options":{"versions":{"omnitrix/framework":"0.1.0"}}}' \
  --repository='{"type":"path","url":"../framework","options":{"versions":{"omnitrix/core":"0.1.0"}}}'
```

## Conventions

- Core contains engine code only and never depends on the framework. The framework uses only
  Core's documented public types; anything marked `@internal` may change without notice.
- Every change comes with tests. Integration tests use real services, never mocks of them.
- Behaviour that depends on OpenSwoole or extension details gets a test and an entry in
  [Platform notes](architecture/platform-notes.md); significant design decisions get a decision
  record.
- Update this documentation and the package's `CHANGELOG.md` with user-visible changes.
  Regenerate the API reference with `npm run api` in the docs repository.
- Commit messages: imperative mood, a short summary line, details in the body when useful.

## Test conventions

- Non-blocking claims are proven, not assumed: overlap is measured with known delays, and a
  sibling coroutine must keep ticking while the operation under test waits.
- Integration tests use real services, never mocks of them, and clean up the keys, tables and
  processes they create.
- Server fixtures are started as child processes on free ports and stopped with SIGTERM, so
  graceful shutdown is exercised on every run.
- TLS fixtures generate throw-away certificates with `tests/Fixtures/tls/make-certs.sh`.

## Documentation site

```bash
cd docs
npm install
npm start          # live preview on http://localhost:3000
npm run build      # static site in build/
```

## Security

Report vulnerabilities privately to Ajmal Alkhaledi <ajmalalkhaledi@gmail.com>; see `SECURITY.md`
in each repository.

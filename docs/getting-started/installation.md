---
sidebar_position: 1
---

# Installation

## Requirements

Omnitrix runs on PHP with the OpenSwoole extension. Installing PHP and its extensions is up to
you and your platform (packages, PECL, PIE, container images); Omnitrix requires them but does
not install them.

| Requirement | Version |
|---|---|
| PHP (NTS) | 8.3 or later |
| ext-openswoole | 26.2 or later, built with OpenSSL and HTTP/2 support |
| ext-redis (phpredis) | 6.3 or later |
| ext-pdo_mysql | mysqlnd build (the default) |
| ext-json, ext-mbstring, ext-pdo | bundled with PHP |
| Composer | 2.x |
| MariaDB or MySQL, Redis | for the database, cache and queue features |

Linux is the supported production platform. Check your PHP:

```bash
php -v
php --ri openswoole | head -5
php --ri redis | head -3
php -m | grep -i pdo_mysql
```

Composer refuses to install Omnitrix when a required extension is missing, and the installer
below prints a table of what is found and what is needed.

## Creating a project

### With the installer

The installer is published on Packagist as
[`omnitrix/installer`](https://packagist.org/packages/omnitrix/installer).

```bash
composer global require omnitrix/installer
omnitrix new my-api
```

Make sure Composer's global `vendor/bin` directory is on your `PATH`
(`composer global config bin-dir --absolute` prints it). `omnitrix new` checks the
requirements, runs `composer create-project` and prints the next steps.

| Option | Effect |
|---|---|
| `--dev` | install the latest development version |
| `--composer=/path/to/composer` | use a specific Composer executable |
| `--repository=<json or url>` | extra Composer repository (for example a private mirror); repeatable |
| `--skip-requirements` | create the project even if the platform check fails |

### With Composer

The application template is published on Packagist as
[`omnitrix/omnitrix`](https://packagist.org/packages/omnitrix/omnitrix); it requires the framework,
[`omnitrix/core`](https://packagist.org/packages/omnitrix/core).

```bash
composer create-project omnitrix/omnitrix my-api
```

Both ways produce the same project and copy `.env.example` to `.env`.

## Running it

```bash
cd my-api
# edit .env: database and Redis credentials
php omnitrix migrate          # offers to create the database if it does not exist yet
php omnitrix serve
```

```bash
curl http://127.0.0.1:8080/
# {"name":"Omnitrix","status":"ok"}
```

`php omnitrix serve` runs in the foreground; stop it with Ctrl+C (in-flight requests finish
first). Continue with [your first API](first-api.md).

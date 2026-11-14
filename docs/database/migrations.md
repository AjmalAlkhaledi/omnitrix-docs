---
sidebar_position: 3
---

# Migrations

Migrations are versioned schema changes in `database/migrations/`. They run in filename order;
each run is recorded with a batch number in the `migrations` table, so a rollback reverts exactly
what the last `migrate` applied.

```bash
php omnitrix make:migration create_orders_table          # implies --create=orders
php omnitrix make:migration add_status_to_orders --table=orders
php omnitrix migrate
php omnitrix migrate:status
php omnitrix migrate:rollback
```

## Writing a migration

A migration file returns an object extending `Migration`, with `up()` and `down()`:

```php
<?php

declare(strict_types=1);

use Omnitrix\Database\Migrations\Migration;
use Omnitrix\Database\Schema\Blueprint;
use Omnitrix\Database\Schema\Schema;

return new class extends Migration {
    public function up(Schema $schema): void
    {
        $schema->create('orders', static function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('number', 32)->unique();
            $table->enum('status', ['pending', 'paid', 'shipped'])->default('pending');
            $table->decimal('total', 10, 2)->unsigned();
            $table->json('meta')->nullable();
            $table->timestamp('paid_at')->nullable()->index();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });
    }

    public function down(Schema $schema): void
    {
        $schema->dropIfExists('orders');
    }
};
```

Changing an existing table:

```php
$schema->table('orders', static function (Blueprint $table): void {
    $table->string('currency', 3)->default('EUR')->after('total');
    $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
    $table->renameColumn('number', 'reference');
    $table->dropColumn('meta');
});
```

All changes to one table are applied as a single `ALTER TABLE` statement.

## Column types

| Method | MySQL type |
|---|---|
| `id()`, `bigIncrements('x')` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` |
| `increments('x')` | `INT UNSIGNED AUTO_INCREMENT PRIMARY KEY` |
| `foreignId('user_id')` | `BIGINT UNSIGNED` (chain `->constrained()`) |
| `string('x', 255)`, `char('x', 2)` | `VARCHAR`, `CHAR` |
| `text`, `mediumText`, `longText` | `TEXT` types |
| `tinyInteger`, `smallInteger`, `integer`, `bigInteger` | integer types; `unsignedInteger`, `unsignedBigInteger` |
| `decimal('x', 10, 2)`, `float`, `double` | numeric types |
| `boolean('x')` | `TINYINT(1)` |
| `date`, `time`, `dateTime('x', precision)`, `timestamp('x', precision)` | date and time types |
| `timestamps()` | nullable `created_at` and `updated_at` |
| `json('x')` | `JSON` |
| `uuid('x')` | `CHAR(36)` |
| `enum('x', ['a', 'b'])` | `ENUM` |
| `binary('x')` | `BLOB` |

## Column modifiers

`->nullable()`, `->default($value)`, `->unsigned()`, `->unique()`, `->index()`, `->primary()`,
`->autoIncrement()`, `->comment('...')`, `->after('column')` (alter only), `->useCurrent()`
(`DEFAULT CURRENT_TIMESTAMP`), `->useCurrentOnUpdate()`, `->charset()`, `->collation()`.
For SQL expressions as defaults use `->default(DB::raw('(UUID())'))`.

## Indexes and foreign keys

```php
$table->unique(['tenant_id', 'email']);
$table->index('created_at');
$table->fullText('body');
$table->primary(['post_id', 'tag_id']);

$table->foreignId('user_id')->constrained();                     // references users.id
$table->foreignId('author_id')->constrained('users');            // explicit table
$table->foreign('sku')->references('sku')->on('products')->cascadeOnUpdate();

$table->dropIndex('orders_status_index');
$table->dropForeign('orders_user_id_foreign');
```

Generated names follow `{table}_{columns}_{type}`, for example `orders_user_id_foreign`.
Referential actions: `cascadeOnDelete()`, `nullOnDelete()`, `restrictOnDelete()`,
`cascadeOnUpdate()`, or `onDelete('no action')`.

## Other schema operations

```php
$schema->drop('legacy');
$schema->dropIfExists('legacy');
$schema->rename('posts', 'articles');
$schema->hasTable('posts');
$schema->hasColumn('posts', 'slug');
```

To run a statement the builder does not cover, execute SQL directly:
`DB::execute('ALTER TABLE orders ADD CHECK (total >= 0)');`

## Running migrations

| Command | Effect |
|---|---|
| `migrate` | runs every pending migration as one new batch |
| `migrate --seed` | the same, then runs `DatabaseSeeder` |
| `migrate:status` | shows each migration, whether it ran and its batch |
| `migrate:rollback [--step=N]` | reverts the last N batches (default 1) |
| `migrate:reset` | reverts every migration |
| `migrate:fresh [--seed]` | drops every table, then migrates from scratch |

MySQL and MariaDB commit DDL statements immediately, so a migration that fails halfway leaves
its earlier statements applied. Keep migrations small (one table or one change each) and test
them with `migrate:fresh` on a development database.

A migration can target another connection: set `public ?string $connection = 'reporting';` in
the class.

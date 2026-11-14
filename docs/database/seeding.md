---
sidebar_position: 6
---

# Seeding

Seeders fill the database with development, demo or test data. They live in `database/seeds/`
(namespace `Database\Seeds`).

```bash
php omnitrix make:seeder ProductSeeder
php omnitrix db:seed                          # runs DatabaseSeeder
php omnitrix db:seed --class=ProductSeeder    # one seeder
php omnitrix migrate:fresh --seed             # rebuild and seed
```

```php
<?php

declare(strict_types=1);

namespace Database\Seeds;

use App\Models\User;
use Omnitrix\Database\Seeding\Seeder;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(UserSeeder::class, ProductSeeder::class);
    }
}

final class UserSeeder extends Seeder
{
    public function run(): void
    {
        $ann = User::create(['name' => 'Ann', 'email' => 'ann@example.com']);
        $ann->posts()->create(['title' => 'Welcome', 'published' => true]);
    }
}
```

Seeders can use models, the query builder and every facade. In production, `db:seed` requires
`--force`.

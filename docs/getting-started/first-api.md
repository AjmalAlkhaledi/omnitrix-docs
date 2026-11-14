---
sidebar_position: 2
---

# Your first API

This walk-through adds an `articles` resource to a new project: a migration, a model with a
relationship, a controller, routes, and a background job.

## 1. Model and migration

```bash
php omnitrix make:model Article --migration
```

This creates `src/Models/Article.php` and `database/migrations/<timestamp>_create_articles_table.php`.
Describe the table in the migration:

```php
<?php

declare(strict_types=1);

use Omnitrix\Database\Migrations\Migration;
use Omnitrix\Database\Schema\Blueprint;
use Omnitrix\Database\Schema\Schema;

return new class extends Migration {
    public function up(Schema $schema): void
    {
        $schema->create('articles', static function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('body');
            $table->boolean('published')->default(false);
            $table->timestamps();
        });
    }

    public function down(Schema $schema): void
    {
        $schema->dropIfExists('articles');
    }
};
```

```bash
php omnitrix migrate
```

## 2. The model

```php
<?php

declare(strict_types=1);

namespace App\Models;

use DateTimeImmutable;
use Omnitrix\Database\Model;
use Omnitrix\Database\Relations\BelongsTo;

/**
 * @property int                    $id
 * @property int                    $user_id
 * @property string                 $title
 * @property string                 $body
 * @property bool                   $published
 * @property DateTimeImmutable|null $created_at
 * @property-read User|null         $user
 */
final class Article extends Model
{
    protected static array $fillable = ['title', 'body', 'published'];

    protected static array $casts = ['published' => 'bool'];

    /** @return BelongsTo<User> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

Add the other side to `src/Models/User.php`:

```php
/** @return HasMany<Article> */
public function articles(): HasMany
{
    return $this->hasMany(Article::class);
}
```

## 3. Controller

```bash
php omnitrix make:controller ArticleController --model=Article
```

The generated controller has `index`, `show`, `store`, `update` and `destroy` actions. Fill in the
validation rules and set the author when creating:

```php
public function store(Request $request): Response
{
    $data = $request->validate([
        'user_id' => 'required|int',
        'title' => 'required|string|max:255',
        'body' => 'required|string',
        'published' => 'bool',
    ]);
    $user = User::findOrFail($data['user_id']);
    $article = $user->articles()->create($data);

    return Response::json($article, 201);
}
```

Returning a model, a collection or a paginator from a handler produces JSON. `findOrFail()`
answers `404` automatically; failed validation answers `422` with the messages per field.

## 4. Routes

```php
// routes/api.php
use App\Controllers\ArticleController;

$router->group('/api', static function (Router $router): void {
    $router->get('/articles', [ArticleController::class, 'index']);
    $router->post('/articles', [ArticleController::class, 'store']);
    $router->get('/articles/{id:\d+}', [ArticleController::class, 'show']);
    $router->put('/articles/{id:\d+}', [ArticleController::class, 'update']);
    $router->delete('/articles/{id:\d+}', [ArticleController::class, 'destroy']);
});
```

```bash
php omnitrix routes
php omnitrix serve
```

```bash
curl -s -X POST http://127.0.0.1:8080/api/articles \
     -H 'Content-Type: application/json' \
     -d '{"user_id":1,"title":"Hello","body":"First article","published":true}'
curl -s 'http://127.0.0.1:8080/api/articles?page=1'
```

## 5. Load relationships without extra queries

Show each article with its author, using one query for the articles and one for all authors:

```php
public function index(Request $request): Paginator
{
    return Article::with('user')->latest()->paginate(perPage: 20, page: (int) ($request->queryParam('page') ?? 1));
}
```

## 6. Work in the background

```bash
php omnitrix make:job NotifyFollowers
```

Register it in `config/queue.php` (`'articles.published' => NotifyFollowers::class`), dispatch it
from the controller with `Queue::dispatch('articles.published', ['article_id' => $article->id])`,
and run a worker next to the server:

```bash
php omnitrix queue:work
```

## Where to go next

- [Directory structure](directory-structure.md) and [configuration](configuration.md)
- [Models](../database/models.md) and [relationships](../database/relationships.md)
- [Concurrency](../async/concurrency.md): running independent work in parallel inside a request
- [Testing](../operations/testing.md) and [deployment](../operations/deployment.md)

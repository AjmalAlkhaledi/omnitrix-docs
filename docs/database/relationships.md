---
sidebar_position: 5
---

# Relationships

Relationships are methods on a model that return a relation object.

```php
final class User extends Model
{
    /** @return HasOne<Profile> */
    public function profile(): HasOne { return $this->hasOne(Profile::class); }

    /** @return HasMany<Post> */
    public function posts(): HasMany { return $this->hasMany(Post::class); }
}

final class Post extends Model
{
    /** @return BelongsTo<User> */
    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    /** @return BelongsToMany<Tag> */
    public function tags(): BelongsToMany { return $this->belongsToMany(Tag::class); }

    /** @return HasMany<Comment> */
    public function comments(): HasMany { return $this->hasMany(Comment::class); }
}
```

| Relation | Tables | Default keys |
|---|---|---|
| `hasOne(Profile::class)` | `users.id` ← `profiles.user_id` | foreign key `user_id`, local key `id` |
| `hasMany(Post::class)` | `users.id` ← `posts.user_id` | foreign key `user_id`, local key `id` |
| `belongsTo(User::class)` | `posts.user_id` → `users.id` | foreign key `user_id`, owner key `id` |
| `belongsToMany(Tag::class)` | `posts` ↔ `post_tag` ↔ `tags` | pivot `post_tag`, keys `post_id` and `tag_id` |

Every default can be overridden:
`hasMany(Post::class, foreignKey: 'author_id')`, `belongsTo(User::class, foreignKey: 'author_id')`,
`belongsToMany(Role::class, pivotTable: 'user_roles', foreignPivotKey: 'member_id', relatedPivotKey: 'role_id')`.
The default pivot table name is both singular table names in alphabetical order.

## Reading related models

As a **property**, the relation is loaded on first access and cached on the model:

```php
$post->user->name;            // User or null
$user->posts->count();        // Collection<Post>
$user->profile?->bio;         // Profile or null
```

As a **method**, it returns a query you can refine:

```php
$published = $user->posts()->where('published', true)->latest()->get();
$latest = $user->posts()->latest()->first();
$count = $post->comments()->count();
```

## Eager loading

Reading a relation as a property inside a loop runs one query per model. Load it for all models
at once with `with()` instead — one query per relation, whatever the number of models:

```php
$posts = Post::with('user', 'tags')->latest()->limit(50)->get();   // 3 queries in total

foreach ($posts as $post) {
    echo $post->user?->name, ': ', implode(', ', $post->tags->pluck('name'));
}
```

| Form | Loads |
|---|---|
| `with('user')` | one relation |
| `with('user', 'tags')` | several relations |
| `with('posts.comments')` | nested: posts, and the comments of those posts |
| `with(['posts' => fn (ModelQuery $q) => $q->where('published', true)])` | a constrained relation |

Already have the models? `$posts->load('user')` on a collection or `$post->load('comments')` on
one model does the same.

## Creating related models

```php
$post = $user->posts()->create(['title' => 'Hello']);        // sets posts.user_id
$user->posts()->save($existingPost);                         // re-parents an existing post
$user->profile()->create(['bio' => 'Writer']);

$post->user()->associate($otherUser);                        // sets posts.user_id
$post->save();
```

## Many-to-many

```php
$post->tags()->attach([1, 2]);                   // ids or models
$post->tags()->attach($tag, ['added_by' => 7]);  // extra pivot columns
$post->tags()->detach(2);
$post->tags()->detach();                         // all
$changes = $post->tags()->sync([2, 3]);          // ['attached' => [3], 'detached' => [1]]
```

The pivot table needs the two foreign keys; a composite primary key prevents duplicates:

```php
$schema->create('post_tag', static function (Blueprint $table): void {
    $table->foreignId('post_id')->constrained()->cascadeOnDelete();
    $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
    $table->primary(['post_id', 'tag_id']);
});
```

## In JSON

Relations that were loaded (eagerly or by accessing the property) are included when a model is
serialised:

```json
{"id": 1, "title": "Hello", "user": {"id": 3, "name": "Ann"}, "tags": [{"id": 1, "name": "php"}]}
```

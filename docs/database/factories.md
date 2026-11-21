---
sidebar_position: 7
---

# Factories

Factories build models with fake data for tests and seeders.

```bash
php omnitrix make:factory PostFactory
```

```php
namespace Database\Factories;

final class PostFactory extends Factory
{
    protected string $model = Post::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(5),
            'body' => $this->faker->paragraph(),
            'published' => false,
            'user_id' => UserFactory::new(),        // creates the author when the post is created
        ];
    }

    public function published(): static
    {
        return $this->state(['published' => true]);
    }
}
```

Add the `HasFactory` trait to the model to write `Post::factory()` (the factory is
`Database\Factories\{Model}Factory`, or set `protected static string $factory`).

```php
$post = Post::factory()->create();                          // saved
$posts = Post::factory()->count(5)->published()->create();  // a collection
$draft = Post::factory()->make(['title' => 'Draft']);       // not saved
$rows = Post::factory()->count(3)->raw();                   // attributes only

Post::factory()->count(4)->sequence(['status' => 'open'], ['status' => 'closed'])->create();
Post::factory()->state(fn (array $attributes) => ['slug' => strtolower($attributes['title'])])->create();
Post::factory()->for($user, 'user_id')->create();           // belongs to an existing model
User::factory()->has(Post::factory()->count(3), 'user_id')->create(); // with children
User::factory()->afterCreating(fn (User $u) => $u->createToken('test'))->create();
```

## Fake data

`$this->faker` is built in (no extra package): `name()`, `firstName()`, `lastName()`, `email()`
(on reserved example domains), `userName()`, `password()`, `word()`, `words()`, `sentence()`,
`paragraph()`, `text()`, `slug()`, `title()`, `numberBetween()`, `randomFloat()`, `boolean()`,
`randomElement()`, `uuid()`, `dateTimeBetween()`, `date()`, `city()`, `country()`,
`streetAddress()`, `postcode()`, `phoneNumber()` (fictional 555 numbers), `url()`, `company()`,
`hexColor()`.

`$this->faker->unique()->email()` never returns the same value twice — use it for columns with a
unique index. `Factory::seed(42)` makes the data repeatable across runs.

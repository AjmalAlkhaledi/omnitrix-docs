---
sidebar_position: 7
---

# Events

Events decouple what happened from what reacts to it. An event is a plain object; listeners
are registered for its class (or a parent class or interface):

```bash
php omnitrix make:event OrderShipped
php omnitrix make:listener SendShipmentEmail --event=OrderShipped --queued
```

```php
// config/events.php
return [
    'listen' => [
        App\Events\OrderShipped::class => [App\Listeners\SendShipmentEmail::class],
        'order.*' => [App\Listeners\AuditOrders::class],      // named events, wildcards
    ],
];
```

```php
use Omnitrix\Facades\Event;

Event::dispatch(new OrderShipped($order));          // runs every listener, returns their results
Event::dispatch('order.paid', [$order]);             // named event with arguments
$answer = Event::until('price.quote', [$cart]);      // first non-null result
```

Listeners can also be registered in `bootstrap.php` with `$app->listen(OrderShipped::class,
SendShipmentEmail::class)` (every worker) or with `Event::listen()` (the current worker only).

| Listener form | Example |
|---|---|
| class with `handle()` or `__invoke()` | `SendShipmentEmail::class` (taken from the container when bound there) |
| class and method | `'App\Listeners\Audit@shipped'`, `[Audit::class, 'shipped']` |
| closure | `fn (OrderShipped $e) => …` |

Listeners run in priority order (`listen($event, $listener, priority: 10)`, higher first, then
registration order). A listener returning `false`, or a PSR-14 `StoppableEventInterface` event
marked stopped, ends the dispatch.

## Queued listeners

A listener class implementing `Omnitrix\Events\ShouldQueue` runs in the queue worker
(`php omnitrix queue:work`) instead of during the request; optional public properties `$queue`
and `$delay` choose the queue and a delay in seconds. The event travels serialized with the job,
so keep events small and free of connections and closures.

## After the transaction commits

An event implementing `Omnitrix\Events\ShouldDispatchAfterCommit` dispatched inside
`DB::transaction()` reaches its listeners only once the transaction commits — never after a
rollback. Outside a transaction it is dispatched at once.

## Model events

Models dispatch `saving`, `saved`, `creating`, `created`, `updating`, `updated`, `deleting` and
`deleted`. A `saving`, `creating`, `updating` or `deleting` listener returning `false` cancels the
operation (`save()` / `delete()` return false); `updating` listeners may still change attributes.

```php
// bootstrap.php
User::creating(fn (User $user) => $user->email !== 'blocked@example.com');
User::observe(UserObserver::class);            // methods named after the events
$app->listen('model.created: ' . User::class, SendWelcome::class);  // through the dispatcher
```

## Testing

```php
$fake = Event::fake();                           // or Event::fake([OrderShipped::class]) for some events
// … exercise the code …
$fake->assertDispatched(OrderShipped::class, fn (OrderShipped $e) => $e->order->id === 10);
$fake->assertNotDispatched(OrderCancelled::class);
```

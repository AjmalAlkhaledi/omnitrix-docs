---
sidebar_position: 7
---

# Broadcasting

Broadcasting pushes server events to connected clients in real time. Events implementing
`ShouldBroadcast` are broadcast when they are dispatched:

```php
use Omnitrix\Broadcasting\{Channel, PrivateChannel, ShouldBroadcast};

final class OrderShipped implements ShouldBroadcast
{
    public function __construct(public int $orderId, public int $userId) {}

    public function broadcastOn(): array
    {
        return [new Channel('orders'), new PrivateChannel('user.' . $this->userId)];
    }

    // optional
    public function broadcastAs(): string { return 'order.shipped'; }          // default: OrderShipped
    public function broadcastWith(): array { return ['id' => $this->orderId]; } // default: public properties
}

Event::dispatch(new OrderShipped($order->id, $order->user_id));
Broadcast::send(new Channel('status'), 'maintenance', ['at' => '22:00']);    // without an event class
```

With the `redis` broadcaster (default when Redis is configured) events are published on Redis, so
every worker of every server delivers them.

## Receiving: Server-Sent Events

Register the stream endpoint; browsers listen with `EventSource`, which reconnects on its own:

```php
use Omnitrix\Broadcasting\BroadcastRoutes;

BroadcastRoutes::register($router, [Authenticate::using('api')]);  // GET /broadcasting/stream?channels=…
BroadcastRoutes::register($router, [], '/public/stream');            // public channels for guests
```

```js
const stream = new EventSource('/broadcasting/stream?channels=orders,private-user.5', { withCredentials: true });
stream.addEventListener('order.shipped', (e) => {
  const { channel, data } = JSON.parse(e.data);
});
```

Each message is `event: {name}` with `data: {"channel": …, "data": …}`. Up to 20 channels per
connection; a comment line keeps idle connections open through proxies
(`BroadcastRoutes::$heartbeatSeconds`, 15 s). Clients that cannot send headers with `EventSource`
can authenticate with a session cookie (session guard) instead of a token.

## Private and presence channels

`private-…` and `presence-…` channels need an authorized user. Authorize them in `bootstrap.php`;
`{name}` parts of the pattern are passed to the callback:

```php
$app->broadcastChannel('user.{id}', fn (User $user, string $id) => (string) $user->id === $id);
$app->broadcastChannel('room.{name}', fn (User $user, string $name) => ['id' => $user->id, 'name' => $user->name]);
```

For a presence channel the callback returns the member's public info (or false). Connecting
clients receive `presence.members` (everyone listening); the others receive `presence.joined` and
`presence.left`. A user connected twice counts once, and leaves when the last connection closes —
noticed at the next heartbeat.

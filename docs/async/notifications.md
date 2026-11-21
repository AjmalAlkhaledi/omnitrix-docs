---
sidebar_position: 6
---

# Notifications

A notification describes one event for a user — an invoice paid, a password changed — and the
channels it goes out on: `mail` (through [Mail](./mail.md)) and `database` (rows in
`notifications`, migration included in the template).

```php
use Omnitrix\Mail\Message;
use Omnitrix\Notifications\Notification;

final class InvoicePaid extends Notification
{
    public function __construct(private readonly int $invoiceId) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): Message      // or a Mailable
    {
        return (new Message())->subject('Invoice paid')->text("Invoice {$this->invoiceId} was paid.");
    }

    public function toArray(object $notifiable): array
    {
        return ['invoice' => $this->invoiceId];
    }
}
```

Models with the `Notifiable` trait receive them; the mail channel uses their `email` attribute
(override `routeNotificationForMail()` for another address):

```php
$user->notify(new InvoicePaid(42));
Notification::send($admins, new InvoicePaid(42));
Notification::route('mail', 'ops@example.com')->notify(new DiskFull()); // not a model

$user->notifications()->get();                // newest first
$user->unreadNotifications()->count();
$notification->markAsRead();
```

A notification implementing `Omnitrix\Events\ShouldQueue` is sent by `php omnitrix queue:work`.
Model recipients travel by class and key and are loaded again in the worker; a recipient deleted
in the meantime is skipped.

```php
$fake = Notification::fake();
// …
$fake->assertSentTo($user, InvoicePaid::class);
```

---
sidebar_position: 5
---

# Mail

Configure a mailer in `config/mail.php` (`MAIL_*` variables): `smtp` for real delivery, `log` to
write messages to the log during development, `array` for tests. SMTP runs on the runtime's
coroutine sockets, so sending suspends only the request that sends.

## Mailables

```php
use Omnitrix\Mail\{Mailable, Message};

final class WelcomeMail extends Mailable
{
    public function __construct(private readonly string $name) {}

    public function build(Message $message): void
    {
        $message->subject("Welcome, {$this->name}")
            ->text("Hi {$this->name},\nthanks for signing up.")
            ->html("<p>Hi {$this->name},</p><p>thanks for signing up.</p>")
            ->attachData($pdf, 'terms.pdf', 'application/pdf');
    }
}
```

```php
use Omnitrix\Facades\Mail;

Mail::to('Ann <ann@example.com>')->send(new WelcomeMail('Ann'));
Mail::to($user->email)->queue(new WelcomeMail($user->name)); // sent by php omnitrix queue:work
Mail::send((new Message())->to('ops@example.com')->subject('Disk full')->text('…')); // without a class
```

The sender is `mail.from` unless the message sets one. Messages carry a plain-text and/or HTML
part, attachments, `cc()`, `bcc()` (recipients not shown in the headers) and `replyTo()`;
non-ASCII names and subjects are encoded, and line breaks in headers are rejected.

| SMTP option | Meaning |
|---|---|
| `encryption` | `tls` (STARTTLS, usually port 587), `ssl` (implicit TLS, port 465), `none` |
| `username`, `password` | AUTH PLAIN or LOGIN, whichever the server offers |
| `timeout` | seconds for the connection and each reply (default 10) |
| `verify_peer` | certificate check (default true; never disable in production) |

## Testing

```php
$fake = Mail::fake();
// …
$fake->assertSent(WelcomeMail::class, fn (WelcomeMail $mail, array $to) => $to === ['ann@example.com']);
$fake->assertQueued(InvoiceMail::class);
$fake->assertNothingSent();
```

---
sidebar_position: 3
---

# Contracts

Contracts are the interfaces of the framework's services, in `Omnitrix\Contracts`. Type your own
code against them instead of the concrete classes: it stays independent of the implementation,
and tests can pass simple doubles. Every worker container holds the configured service under its
contract name.

| Contract | Service | Facade |
|---|---|---|
| `Hasher` | password hashing (bcrypt, argon2id) | `Hash` |
| `Encrypter` | AES-256-GCM with `app.key` | `Crypt` |
| `EventDispatcher` | events and listeners | `Event` |
| `UrlGenerator` | URLs and signed URLs | `URL` |
| `Gate` | abilities and policies | `Gate` |
| `Mailer` | e-mail | `Mail` |
| `Broadcaster` | broadcast channels | `Broadcast` |
| `Guard` | one authentication guard | `Auth::guard()` |
| `SessionHandler` | session storage (implement it for another store) | — |
| `Authenticatable` | users the guards can log in (model trait `Auth\Authenticatable`) | — |
| `MustVerifyEmail` | users who confirm their e-mail (trait `Auth\Verification\MustVerifyEmail`) | — |

```php
use Omnitrix\Contracts\Mailer;

final class InvoiceService
{
    public function __construct(private readonly Mailer $mailer) {}

    public function remind(Invoice $invoice): void
    {
        $this->mailer->send(new InvoiceReminder($invoice), $invoice->email);
    }
}

// in a handler: new InvoiceService(Facade::container()->get(Mailer::class))
```

Contracts follow the [versioning policy](./versioning.md): changing one is a breaking change,
listed in the upgrade notes.

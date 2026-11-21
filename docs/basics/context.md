---
sidebar_position: 8
---

# Context

`Context` holds facts about the current request or job — a tenant, a trace id, the acting user —
that everything it does should know about:

```php
use Omnitrix\Facades\Context;

// in a middleware
Context::add('tenant', $tenant->id);
Context::addHidden('api_key_id', $key->id);   // travels with jobs, never logged

Context::get('tenant');
Context::push('trail', 'checkout');            // append to a list
Context::all();                                // visible values
```

- **Logs**: every line written during the request carries the visible values under `context`
  (`{"message":"order placed","context":{"tenant":7}}`); hidden values are never logged.
- **Queued jobs**: jobs dispatched during the request (including queued event listeners) take
  both visible and hidden values with them; the worker restores them while the job runs, so its
  log lines and the jobs it dispatches carry them too.
- **Scope**: values belong to the request (or job) and the coroutines it starts; concurrent
  requests never see each other's values. Outside a request or job `add()` does nothing.

Values must be JSON-compatible (scalars, arrays); store ids rather than objects.

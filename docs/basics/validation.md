---
sidebar_position: 5
---

# Validation

Validate request input with `$request->validate()`. It returns only the fields that have rules
and answers `422` when anything fails:

```php
$data = $request->validate([
    'email' => 'required|email|max:255',
    'name' => 'required|string|between:2,100',
    'age' => 'nullable|int|between:13,130',
    'role' => 'in:admin,editor,viewer',
    'tags' => 'array|max:10',
]);
```

```json
{
  "error": {
    "status": 422,
    "message": "The given data was invalid",
    "errors": { "email": ["The email must be a valid email address."] }
  },
  "request_id": "6b6a7a2277941ec27ba5e964acef9f2a"
}
```

Input is read from the JSON body, then form fields, then the query string (see
`$request->input()`).

## Rules

| Rule | Passes when |
|---|---|
| `required` | present and not empty |
| `nullable` | the field may be `null` (other rules are skipped for null) |
| `string`, `int`, `numeric`, `bool`, `array` | value has that type (`int` accepts integer strings) |
| `email` | a valid e-mail address |
| `url` | an `http` or `https` URL |
| `uuid` | an RFC 4122 UUID |
| `min:N`, `max:N` | string length, array size or numeric value is at least / at most N |
| `between:A,B` | as min and max together |
| `in:a,b,c` | one of the listed values |
| `regex:/pattern/` | matches the pattern |

Rules are separated by `|`. Fields without `required` are optional: their rules only apply when
they are present.

## Outside a request

```php
use Omnitrix\Validation\Validator;
use Omnitrix\Validation\ValidationException;

try {
    $clean = (new Validator(['email' => 'required|email']))->validate($input);
} catch (ValidationException $e) {
    $errors = $e->details()['errors'];
}
```

## Mass assignment

Models only accept attributes listed in their `$fillable` property from `create()`, `fill()` and
`update()`, so passing validated input straight to a model cannot set columns such as `id` or
`is_admin` unless you allow it. See [Models](../database/models.md).

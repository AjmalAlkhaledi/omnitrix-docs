---
sidebar_position: 7
---

# Uploads and file storage

## Uploaded files

```php
use Omnitrix\Facades\Storage;

$router->post('/api/me/avatar', function (Request $request): Response {
    $request->validate(['avatar' => 'required|file|image|max:2048']); // max in kilobytes
    $path = $request->file('avatar')->store('avatars', 'public');      // avatars/3f9c…e1.png

    return Response::json(['url' => Storage::disk('public')->url($path)], 201);
});
```

`$request->file('avatar')` is an `UploadedFile` (or `null`); `$request->allFiles()` has every
upload, with a list for fields such as `photos[]`.

| Method | |
|---|---|
| `mimeType()`, `extension()` | detected from the file's **contents** (ext-fileinfo) |
| `clientName()`, `clientMimeType()` | what the client sent — do not trust or use as a path |
| `size()` | bytes |
| `store($dir, $disk)` | stores under a random name with the detected extension; returns the path |
| `storeAs($dir, $name, $disk)` | stores under your name |
| `isValid()`, `errorMessage()` | the upload arrived completely |

OpenSwoole deletes the temporary file when the request ends: store it during the request. The
request size is limited by `server.package_max_length` and `http.max_body_size`.

### Validation rules

| Rule | Passes when |
|---|---|
| `file` | a file was uploaded successfully |
| `image` | its contents are a jpg, png, gif, webp, avif, bmp, … image (**not SVG**, which can carry scripts) |
| `mimes:pdf,docx` | the extension of the detected type is listed |
| `mimetypes:image/*,application/pdf` | the detected type is listed |
| `min:`, `max:`, `between:` | the size in kilobytes |

## Disks

`config/filesystems.php` names the disks; `Storage::...` uses the default one,
`Storage::disk('s3')->...` a named one.

```php
Storage::put('reports/2026-11.csv', $csv);
Storage::disk('public')->putFileAs('logos/acme.png', '/tmp/logo.png');
$csv = Storage::get('reports/2026-11.csv');        // FileNotFoundException when missing
foreach (Storage::disk('s3')->chunks('exports/big.json') as $chunk) { … }   // without loading it whole
Storage::files('reports');                         // ['reports/2026-11.csv'], recursive: true for subfolders
Storage::delete(['a.txt', 'b.txt']);
```

| Method | |
|---|---|
| `exists`, `get`, `chunks`, `put`, `putFileAs` | read and write |
| `copy`, `move`, `delete`, `deleteDirectory`, `files` | manage |
| `size`, `lastModified`, `mimeType` | inspect |
| `url($path)` | public URL (the disk's `url`) |
| `temporaryUrl($path, 300)` | a link valid for 300 seconds (or until a `DateTime`) |
| `response($path, $downloadName = null)` | a response with the file, inline or as a download |

Paths are relative to the disk and may not contain `..`; use your own names or `store()`'s random
ones, never the client's file name.

### Drivers

| Driver | |
|---|---|
| `local` | a directory; `visibility` `public` (0644) or `private` (0600, the default) |
| `s3` | AWS S3 and S3-compatible services (Cloudflare R2, Backblaze B2, Garage, Ceph, DigitalOcean Spaces): `key`, `secret`, `region`, `bucket`, `endpoint` (non-AWS), `use_path_style_endpoint`, `url` (CDN), `root` (key prefix). Files over 16 MB upload in parts. |
| `memory` | in memory, for tests |

### Serving files

`StorageRoutes::register($router)` (in the template's `routes/api.php`) serves:

- the **public** disk at `/storage/{path}` — what `Storage::disk('public')->url()` returns;
- **temporary links** of local disks at `/storage-temporary/{disk}/{path}`, only with a valid,
  unexpired signature (`app.key`).

For S3, `temporaryUrl()` is a presigned S3 URL (at most 7 days) and `response()` redirects to one,
so files never pass through the workers.

Served files are sent with `X-Content-Type-Options: nosniff` and a sandboxing
`Content-Security-Policy`; HTML, SVG, XML and JavaScript are always downloaded, never displayed,
so an uploaded file cannot run scripts on your API's origin.

## Testing

```php
$disk = Storage::fake('public');                   // in memory, for this worker
$file = UploadedFile::fake('me.png', file_get_contents(__DIR__ . '/fixtures/me.png'));
// … call the endpoint …
$disk->assertExists('avatars/' . $name);
$disk->assertMissing('avatars/old.png');
$disk->assertCount(1, 'avatars');
```

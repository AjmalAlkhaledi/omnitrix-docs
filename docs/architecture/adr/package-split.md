# ADR-004: Package layout — application template and one framework package

Status: Accepted (2026-11-14)

## Context

Applications need a starting point they own (configuration, routes, models, migrations, a
command line) and framework logic they do not have to read or change. The framework layer
(application object, routing, middleware, facades, models, console) and the runtime engine
(server lifecycle, pools, drivers, concurrency) are released together and tested together;
publishing them as separate packages added version coordination without benefit to
applications.

## Decision

- `omnitrix/omnitrix` is the application template (Composer type `project`), installed with
  `composer create-project omnitrix/omnitrix my-api` or `omnitrix new my-api`. It contains no
  framework logic.
- `omnitrix/core` contains all framework logic, installed in `vendor/`:
  - the framework layer, namespace `Omnitrix\`, in `src/`;
  - the engine, namespace `Omnitrix\Core\`, in `src/Core/`.
- The engine never uses the framework layer. The transport depends on
  `Http\HttpErrorInterface` rather than on framework exception classes; the framework's
  `HttpException` implements it.
- Engine types that appear in the framework's public API (request context, worker context,
  query builder, HTTP client responses, typed exceptions, concurrency handles) are documented
  as stable. Everything else in the engine is an implementation detail; plumbing that must be
  `public` for technical reasons is marked `@internal`.
- `omnitrix/installer` provides the `omnitrix new` command.

## Consequences

- One version number covers framework and engine; an application updates both with
  `composer update omnitrix/core`.
- The layering is enforced by namespaces, `@internal` markers and code review rather than by
  separate packages.

# ADR-004: Separate Core and Framework packages

Status: Accepted (2026-11-13)

## Context

The runtime engine (server lifecycle, pools, drivers, concurrency) and the developer-facing
framework (application object, routing, middleware, facades, validation, security) change at
different speeds and for different reasons. Keeping them in one package exposes engine
internals as if they were application API and couples their release cycles.

## Decision

- `omnitrix/core` (`Omnitrix\Core\`) contains the engine. It has no routing, middleware or
  application conventions and never depends on the framework.
- `omnitrix/omnitrix` (`Omnitrix\`) contains the framework and depends on `omnitrix/core`.
  Applications depend on the framework only.
- The transport depends on `Http\HttpErrorInterface` rather than on framework exception
  classes; the framework's `HttpException` implements it.
- Core types that legitimately appear in the framework's public API (request context, worker
  context, query builder, HTTP client responses, typed exceptions, concurrency handles) are
  documented as stable. Everything else in Core is an implementation detail; plumbing that must
  be `public` for technical reasons is marked `@internal`.

## Consequences

- Core changes that the framework needs are released in Core first; the framework raises its
  version constraint.
- Each repository has its own tests, static analysis and documentation.

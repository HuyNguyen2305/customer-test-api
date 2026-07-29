# src/routers

Thin Fastify route definitions — no logic beyond wiring schema, auth, and
controller method together.

## Convention
- File: `<domain>.router.js`, default export
  `async function xRouter(fastify, opts) { ... }`.
- Auto-loaded via `@fastify/autoload` pointed at this directory
  (`src/app.js`) — dropping a correctly-named file here is enough for it to
  be registered; there is no manual route-registration step.
- Intended (not yet implemented) pattern per route: attach a schema object
  from `#schemas/*`, attach an auth `preHandler` for the relevant strategy,
  and resolve the controller via the container decorated onto fastify
  (`fastify.container.resolve(CONTROLLER_KEYS.X)`) to call its method.

## Current state
Every router file is currently a single empty line
(`export default async function xRouter(fastify, opts) {}`) — no route
bodies, schema attachment, or auth wiring exists yet anywhere in this folder.

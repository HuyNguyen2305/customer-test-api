# src/models

Sequelize model definitions — one file per table. Tenant-agnostic: schema-per-tenant
switching is handled entirely by `BaseRepository.setSchema()` in the repository layer,
not here (see root CLAUDE.md).

## Convention
- Filename: kebab-case + `.model.js` (e.g. `payment-option.model.js`).
- Single default export, factory signature: `(sequelize, DataTypes) => { ... }`.
- The factory body defines the model (`sequelize.define(...)` / `Model.init`) — it does
  not return or register anything itself.

## Registration
`index.js` is a manual registry, not auto-discovery:
1. Import the new model's factory function.
2. Add it to the array that `index.js` loops over to call `define(sequelize, DataTypes)`.

Both steps are required — a model file alone does nothing until wired into `index.js`.

## Current state
All model files (`balance`, `document`, `estimate`, `invoice`, `payment-option`,
`work-order`) are currently unimplemented stubs (`export default (sequelize, DataTypes) => {};`).
When implementing one, don't copy an existing file as a populated example — there isn't
one yet. Use `index.js` to confirm the registration pattern instead.

Per the root CLAUDE.md feature-add order, Model is step 1 of
Model → Repository → Service → Controller → Schema → Route.

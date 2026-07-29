# src/repositories

Data access layer. One repository per domain, extends `BaseRepository`
(`#common/base-repository.js`).

## BaseRepository
- Constructor takes a Sequelize `model` directly (not resolved by key itself).
- `setSchema()` reads `requestContext.get('identity')` and returns
  `this.model.schema(identity.schema)` if set, else the plain model — this **is**
  the schema-per-tenant mechanism, applied per call.
- Provides `findAll`/`findByPk`/`findOne`/`create`/`update`/`destroy`, each
  routed through `setSchema()`. Subclasses add domain methods on top; they
  don't need to touch schema logic themselves.

## Convention
- File: `<domain>.repository.js`, class `XRepository extends BaseRepository`.
- Exception: `auth.repository.js` is a plain class (no `extends BaseRepository`)
  since auth has no schema-scoped CRUD.
- DI: the matching model is registered `asValue` in `container.js` (e.g.
  `invoiceModel: asValue(models.Invoice)`); the repository is registered
  `asClass(XRepository).scoped()` under `REPOSITORY_KEYS.X_REPOSITORY`
  (`#common/constants/singleton.js`). Under Awilix PROXY mode, a repository
  constructor override should destructure `{ invoiceModel }` to pass into
  `super(invoiceModel)`.

## Current state
All repository method bodies are currently empty stubs. The CRUD/schema
mechanism above is real and implemented in `BaseRepository` — it's the
subclasses that don't exercise it yet. Don't expect a populated example file
to copy from; use `base-repository.js` + `container.js` to confirm the wiring.

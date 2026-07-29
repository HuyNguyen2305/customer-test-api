# src/common

Shared infra consumed by every layer. Current actual contents:

- `base-repository.js` — `BaseRepository`: constructor takes a Sequelize
  `model`; `setSchema()` reads `requestContext.get('identity')` and returns
  `this.model.schema(identity.schema)` if set, else the plain model. Wraps
  `findAll`/`findByPk`/`findOne`/`create`/`update`/`destroy` through
  `setSchema()`. See `#repositories` CLAUDE.md for the subclass pattern.
- `request-context.js` — thin `AsyncLocalStorage` wrapper: `run(store, cb)`,
  `get(key)`, `set(key, value)`. This is how request-scoped `identity`
  (tenant schema, auth context) reaches `BaseRepository.setSchema()`.
- `sequelize.js` — singleton `Sequelize` instance built from `DB_*` env vars,
  `dialect: postgres`, `logging: false`.
- `constants/singleton.js` — `REPOSITORY_KEYS` / `SERVICE_KEYS` /
  `CONTROLLER_KEYS`, plain objects mapping one entry per domain, consumed by
  `container.js`. Adding a new domain requires adding a key to all three plus
  a container registration — there's no auto-discovery.

## Important gap vs. the root CLAUDE.md
The root CLAUDE.md's "This application" section describes
`src/common/auth/strategies/` (Passport strategies: access-token, customer,
customer-id, account-id, user-name, portal-token) and a payment-gateway
factory at `src/common/factory/payment-gateway/` (Stripe/Square). **Neither
exists yet** — `src/common/` only has the four files listed above. Treat that
part of the root doc as target/future state, not current code. Don't spend
time searching for those paths; if asked to add auth strategies or payment
gateways, they need to be built from scratch, not extended.

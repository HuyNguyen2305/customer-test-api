# Architecture & conventions
Fastify + Sequelize (PostgreSQL) + Awilix DI REST API. Layered
`Router -> Controller -> Service -> Repository -> Model`, one direction only, schema-per-tenant multi-tenancy, JEST ESM tests.
**Reusable template** apllies to any app built on this codebase.
## Code style
This project uses ESLint + Prettier, enforced automatically via hooks after every edit.
Do not manually reformat code - the hook handles it.
## Code review workflow
When asked to check for bugs:
1. Scope to `git diff` (or `git dif main` for branches) - don't scan the whole project unless asked.
2. Skip lint/format on Claude-authored changes (the hook already enforced it); for anything else in the diff, run `npm run lint && run fomat:check` first.
3. Focus on logic/edge-case/race bugs, not style.
4. Only open files outside the diff if something flagged points there.
---
### Reusable template
-   **Layers**: Routers (`src/routers/`, auto-loaded Fastify routes, thin) ->
    Controllers (`src/controller/`, HTTP orchestration only, no business logic) ->
    Services (`src/services/`, business logic) -> Repositories (`src/repositories/`, data access, extend `BaseRepository`) -> Models (`src/models/`, one per table).
    Schema (`src.schemas/`) validate requests/response and power Swagger. Other dirs: `src/common/` (auth, shared base classes, constants), `config/` / `migration/`/ `scripts/` (Sequelize CLI, Umzug, ops scripts).
-   **DI**: every layer registers into Awilix (`src/container.js); resolve by key
    (`REPOSITORY_KEYS`/`SERVICE_KEYS`/`CONTROLLER_KEYS` from `#constants/singleton`), never auto-wired. Kebab-case, type-suffixed filenames (`booking.service.js`).
-   **Imports**: Node subpath aliases (`#service/*`, `repositories/*`, etc. - full map in `package.json`'s `imports`), never relative paths across layers.
-   **Adding a features**: Model -> Repository -> Service -> Controller -> Schema -> Route, then tests - same order as layers above.
-   **Controllers**: Success responses are `{ success: true, message data }` via
    `reply.send(...)`; errors throw `CustomError`/ a subclass from `#configs/error`.
-   **Auth**: Passport-based (`src/common/auth/strategies/`); `setIdentity`
    populates `requestContext.get('identity')` for every downstream layer.
-   **Multi-tenancy**: schema-per-tenant, not a `tenant_id` column - `BaseRepository.setSchema()` switches Postgres schema per query from the request's identity.
-   **Tests**: `test/unit/**` (no DB) vs `test/integation/**` (real Postgres, transaction rolled back per test) - one test file per source method, mirrored directory per source file. Two gotchas: mock via `jest.unstable_mockModule('#alias', ...)` *before* the dynamic `imports()` of the module under test (static imports load too early to mock); instantiate the class under test with `Object.create(Classname.prototype)` rather than through Awilix, to keep the test isolated. Integration tests seed via `seedwithTransaction` (`test/helpers/seed-fixtures.js`) using fixtures from `tests/fixtures/*.cjs`.
---
## This application: Portal API
- Customers portal: Log in/out, balance, invoices, estimates, documents, work orders, payment options, change password.
- Auth strategies: `access-token`, `customer`, `customer-id`, `account-id`, `user-name`, `portal-token`.
- Payment gateways: Stripe and Square, via a factory in `src/common/factory/payment-gateway/`.
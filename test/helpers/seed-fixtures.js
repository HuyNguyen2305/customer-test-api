// Requires a reachable Postgres instance using the DB_* env vars from .env.
// Tables are created in a dedicated `test_tenant` schema by syncing the real
// Sequelize models (the Umzug migrations only target the default schema).
//
// Repository methods (e.g. BalanceRepository.getBalance/setAmount) don't accept
// a `transaction` option, so seeded rows inserted inside an open transaction
// would be invisible to a repository call running on a different pooled
// connection. Instead, each test commits its fixtures and the helper
// truncates the synced tables afterwards, giving the same "clean slate per
// test" guarantee without requiring repository signatures to change.
import models, { sequelize } from '#models/index.js';
import { requestContext } from '#common/request-context.js';

export const TEST_SCHEMA = 'test_tenant';

// Caches the in-flight promise, not just a boolean: if a caller's sync pass
// runs longer than the test that triggered it, a *later* test must await the
// same operation rather than kicking off a second one concurrently against
// the same tables.
let schemaReadyPromise = null;

function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      // Drop and recreate rather than incrementally ALTER: this always
      // matches the current models exactly (no risk of the shared schema
      // drifting from them again as they evolve), it's fast since there's no
      // diffing involved, and it sidesteps Sequelize's known fragility around
      // altering Postgres ENUM types.
      await sequelize.query(`DROP SCHEMA IF EXISTS "${TEST_SCHEMA}" CASCADE`);
      await sequelize.createSchema(TEST_SCHEMA, { ifNotExists: true });

      // Models aren't declared in FK-dependency order, so a single top-to-bottom
      // sync pass can hit a model whose referenced table doesn't exist yet.
      // Retry the stragglers across passes until none are left (or nothing
      // makes progress, meaning a real error) instead of assuming an order.
      let pending = Object.values(models);
      let lastError;
      while (pending.length) {
        const stillPending = [];
        for (const model of pending) {
          try {
            await model.schema(TEST_SCHEMA).sync();
          } catch (error) {
            lastError = error;
            stillPending.push(model);
          }
        }
        if (stillPending.length === pending.length) throw lastError;
        pending = stillPending;
      }
    })();
  }

  return schemaReadyPromise;
}

export async function seedWithTransaction(fixtures, testFn) {
  await ensureSchema();

  const seeded = {};
  try {
    for (const [modelName, rows] of Object.entries(fixtures)) {
      seeded[modelName] = [];
      for (const row of rows) {
        seeded[modelName].push(await models[modelName].schema(TEST_SCHEMA).create(row));
      }
    }

    await requestContext.run(new Map([['identity', { schema: TEST_SCHEMA }]]), () => testFn({ seeded }));
  } finally {
    // Delete only the rows this call created (by id), in reverse creation
    // order so FK-referenced rows survive until their dependents are gone.
    // A table-wide truncate here would race with other Jest worker
    // processes seeding/reading the same shared `test_tenant` schema.
    for (const modelName of Object.keys(fixtures).reverse()) {
      for (const instance of seeded[modelName] ?? []) {
        await models[modelName].schema(TEST_SCHEMA).destroy({ where: { id: instance.id } });
      }
    }
  }
}

export default seedWithTransaction;

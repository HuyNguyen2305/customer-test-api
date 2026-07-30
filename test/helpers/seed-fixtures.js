// Requires a reachable Postgres instance using the DB_* env vars from .env.
// Tables are created in a dedicated `test_tenant` schema by syncing the real
// Sequelize models (the Umzug migrations only target the default schema).
//
// Repository methods (e.g. BalanceRepository.getBalance/payOff) don't accept
// a `transaction` option, so seeded rows inserted inside an open transaction
// would be invisible to a repository call running on a different pooled
// connection. Instead, each test commits its fixtures and the helper
// truncates the synced tables afterwards, giving the same "clean slate per
// test" guarantee without requiring repository signatures to change.
import models, { sequelize } from '#models/index.js';
import { requestContext } from '#common/request-context.js';

export const TEST_SCHEMA = 'test_tenant';

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  await sequelize.createSchema(TEST_SCHEMA, { ifNotExists: true }).catch(() => {});

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

  schemaReady = true;
}

export async function seedWithTransaction(fixtures, testFn) {
  await ensureSchema();

  try {
    const seeded = {};
    for (const [modelName, rows] of Object.entries(fixtures)) {
      seeded[modelName] = [];
      for (const row of rows) {
        seeded[modelName].push(await models[modelName].schema(TEST_SCHEMA).create(row));
      }
    }

    await requestContext.run(new Map([['identity', { schema: TEST_SCHEMA }]]), () => testFn({ seeded }));
  } finally {
    // Also runs when seeding itself fails partway through, so a failed test
    // never leaves rows behind to collide with the next run's fixture ids.
    for (const modelName of Object.keys(fixtures)) {
      await models[modelName].schema(TEST_SCHEMA).destroy({ where: {}, truncate: true, cascade: true });
    }
  }
}

export default seedWithTransaction;

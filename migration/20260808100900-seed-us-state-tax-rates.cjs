'use strict';

// Starting slice: a handful of US state sales-tax rates so automatic invoice tax
// calculation has something to match against. These are illustrative state-level
// rates, not combined state+local rates — expanding/correcting them later is just
// table data, not a schema change.
const SEED_RATES = [
  { name: 'California Sales Tax', code: 'CA-SALES', state: 'CA', rate: 7.25 },
  { name: 'Texas Sales Tax', code: 'TX-SALES', state: 'TX', rate: 6.25 },
  { name: 'New York Sales Tax', code: 'NY-SALES', state: 'NY', rate: 4.0 },
];

module.exports = {
  async up({ context: queryInterface }) {
    const { randomUUID } = require('crypto');
    const now = new Date();

    await queryInterface.bulkInsert(
      'tax_rates',
      SEED_RATES.map((seed) => ({
        id: randomUUID(),
        name: seed.name,
        code: seed.code,
        rate: seed.rate,
        type: 'sales',
        country: 'US',
        state: seed.state,
        effectiveFrom: null,
        effectiveTo: null,
        createdAt: now,
        updatedAt: now,
      })),
    );
  },

  async down({ context: queryInterface }) {
    await queryInterface.bulkDelete('tax_rates', {
      code: SEED_RATES.map((seed) => seed.code),
    });
  },
};

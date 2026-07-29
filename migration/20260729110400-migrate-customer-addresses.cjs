'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { randomUUID } = require('crypto');
    const { QueryTypes } = require('sequelize');

    const customers = await queryInterface.sequelize.query(
      'SELECT "id", "address" FROM "customers" WHERE "address" IS NOT NULL AND "address" <> \'\'',
      { type: QueryTypes.SELECT },
    );

    if (!customers.length) return;

    const now = new Date();
    await queryInterface.bulkInsert(
      'addresses',
      customers.map((customer) => ({
        id: randomUUID(),
        customerId: customer.id,
        label: 'Primary',
        line1: customer.address,
        line2: null,
        city: null,
        state: null,
        zip: null,
        country: null,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      })),
    );
  },

  async down({ context: queryInterface }) {
    await queryInterface.bulkDelete('addresses', {
      label: 'Primary',
      isDefault: true,
    });
  },
};

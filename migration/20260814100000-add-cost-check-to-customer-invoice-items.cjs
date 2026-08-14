'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { Op } = require('sequelize');

    // Defense-in-depth backstop: cost is no longer client-writable on the
    // customer-facing add/update endpoints (it's derived server-side from
    // the Item catalog), but this constraint guards the column itself
    // against any other write path ever inserting a negative value.
    await queryInterface.addConstraint('customer_invoice_items', {
      fields: ['cost'],
      type: 'check',
      where: { cost: { [Op.gte]: 0 } },
      name: 'customer_invoice_items_cost_non_negative',
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeConstraint('customer_invoice_items', 'customer_invoice_items_cost_non_negative');
  },
};

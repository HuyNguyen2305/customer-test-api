'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.addIndex('addresses', ['customerId'], {
      name: 'addresses_customer_id_idx',
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeIndex('addresses', 'addresses_customer_id_idx');
  },
};

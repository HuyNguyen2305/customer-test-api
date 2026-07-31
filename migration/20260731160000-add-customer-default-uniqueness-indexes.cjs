'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.addIndex('addresses', ['customerId'], {
      name: 'addresses_customer_id_default_unique_idx',
      unique: true,
      where: { isDefault: true },
    });
    await queryInterface.addIndex('customer_payment_methods', ['customerId'], {
      name: 'customer_payment_methods_customer_id_default_unique_idx',
      unique: true,
      where: { isDefault: true },
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeIndex('addresses', 'addresses_customer_id_default_unique_idx');
    await queryInterface.removeIndex('customer_payment_methods', 'customer_payment_methods_customer_id_default_unique_idx');
  },
};

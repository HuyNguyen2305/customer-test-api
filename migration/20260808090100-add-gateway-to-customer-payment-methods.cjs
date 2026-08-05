'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    // Sequelize's changeColumn does not reliably add new values to an existing
    // Postgres enum type — ALTER TYPE ... ADD VALUE directly instead.
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_customer_payment_methods_type" ADD VALUE IF NOT EXISTS 'open_credit'`,
    );
    await queryInterface.changeColumn('customer_payment_methods', 'token', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_payment_methods', 'gateway', {
      type: DataTypes.ENUM('stripe', 'square'),
      allowNull: true,
    });
    await queryInterface.addColumn('customer_payment_methods', 'gatewayCustomerId', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_payment_methods', 'creditBalance', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    });

    // At most one open-credit "wallet" row per customer.
    await queryInterface.addIndex('customer_payment_methods', ['customerId'], {
      name: 'customer_payment_methods_customer_id_open_credit_unique_idx',
      unique: true,
      where: { type: 'open_credit' },
    });
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.removeIndex(
      'customer_payment_methods',
      'customer_payment_methods_customer_id_open_credit_unique_idx',
    );
    await queryInterface.removeColumn('customer_payment_methods', 'creditBalance');
    await queryInterface.removeColumn('customer_payment_methods', 'gatewayCustomerId');
    await queryInterface.removeColumn('customer_payment_methods', 'gateway');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_customer_payment_methods_gateway";');
    await queryInterface.changeColumn('customer_payment_methods', 'token', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    // Note: Postgres cannot remove a value from an existing enum type, so
    // 'open_credit' stays in enum_customer_payment_methods_type on rollback.
  },
};

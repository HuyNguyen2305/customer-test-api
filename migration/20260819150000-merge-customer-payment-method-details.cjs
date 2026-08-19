'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customer_payment_methods', 'paymentDetails', {
      type: DataTypes.JSONB,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE customer_payment_methods
      SET "paymentDetails" = jsonb_build_object(
        'token', token,
        'gateway', gateway,
        'gatewayCustomerId', "gatewayCustomerId",
        'creditBalance', "creditBalance"
      )
      WHERE token IS NOT NULL
        OR gateway IS NOT NULL
        OR "gatewayCustomerId" IS NOT NULL
        OR "creditBalance" IS NOT NULL
    `);

    await queryInterface.removeColumn('customer_payment_methods', 'token');
    await queryInterface.removeColumn('customer_payment_methods', 'gateway');
    await queryInterface.removeColumn('customer_payment_methods', 'gatewayCustomerId');
    await queryInterface.removeColumn('customer_payment_methods', 'creditBalance');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_customer_payment_methods_gateway";');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customer_payment_methods', 'token', {
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

    await queryInterface.sequelize.query(`
      UPDATE customer_payment_methods
      SET
        token = "paymentDetails"->>'token',
        gateway = ("paymentDetails"->>'gateway')::"enum_customer_payment_methods_gateway",
        "gatewayCustomerId" = "paymentDetails"->>'gatewayCustomerId',
        "creditBalance" = ("paymentDetails"->>'creditBalance')::numeric
      WHERE "paymentDetails" IS NOT NULL
    `);

    await queryInterface.removeColumn('customer_payment_methods', 'paymentDetails');
  },
};

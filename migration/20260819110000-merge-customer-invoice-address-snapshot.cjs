'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customer_invoices', 'addressSnapshot', {
      type: DataTypes.JSONB,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "customer_invoices" SET "addressSnapshot" = jsonb_build_object(
        'addressLabel', "addressLabel",
        'addressLine1', "addressLine1",
        'addressLine2', "addressLine2",
        'addressCity', "addressCity",
        'addressState', "addressState",
        'addressZip', "addressZip",
        'addressCountry', "addressCountry"
      )
      WHERE "addressId" IS NOT NULL
    `);

    await queryInterface.removeColumn('customer_invoices', 'addressLabel');
    await queryInterface.removeColumn('customer_invoices', 'addressLine1');
    await queryInterface.removeColumn('customer_invoices', 'addressLine2');
    await queryInterface.removeColumn('customer_invoices', 'addressCity');
    await queryInterface.removeColumn('customer_invoices', 'addressState');
    await queryInterface.removeColumn('customer_invoices', 'addressZip');
    await queryInterface.removeColumn('customer_invoices', 'addressCountry');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customer_invoices', 'addressLabel', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoices', 'addressLine1', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoices', 'addressLine2', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoices', 'addressCity', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoices', 'addressState', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoices', 'addressZip', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoices', 'addressCountry', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "customer_invoices" SET
        "addressLabel" = "addressSnapshot"->>'addressLabel',
        "addressLine1" = "addressSnapshot"->>'addressLine1',
        "addressLine2" = "addressSnapshot"->>'addressLine2',
        "addressCity" = "addressSnapshot"->>'addressCity',
        "addressState" = "addressSnapshot"->>'addressState',
        "addressZip" = "addressSnapshot"->>'addressZip',
        "addressCountry" = "addressSnapshot"->>'addressCountry'
    `);

    await queryInterface.removeColumn('customer_invoices', 'addressSnapshot');
  },
};

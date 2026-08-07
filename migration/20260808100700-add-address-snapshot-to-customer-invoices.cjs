'use strict';

module.exports = {
  async up({ context: queryInterface }) {
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

    // Best-effort backfill only: existing invoices never captured a snapshot at
    // creation time, so this copies whatever the linked address currently says
    // rather than what it said when the invoice was generated.
    await queryInterface.sequelize.query(`
      UPDATE "customer_invoices" ci
      SET "addressLabel" = a."label",
          "addressLine1" = a."line1",
          "addressLine2" = a."line2",
          "addressCity" = a."city",
          "addressState" = a."state",
          "addressZip" = a."zip",
          "addressCountry" = a."country"
      FROM "addresses" a
      WHERE a."id" = ci."addressId"
    `);
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('customer_invoices', 'addressCountry');
    await queryInterface.removeColumn('customer_invoices', 'addressZip');
    await queryInterface.removeColumn('customer_invoices', 'addressState');
    await queryInterface.removeColumn('customer_invoices', 'addressCity');
    await queryInterface.removeColumn('customer_invoices', 'addressLine2');
    await queryInterface.removeColumn('customer_invoices', 'addressLine1');
    await queryInterface.removeColumn('customer_invoices', 'addressLabel');
  },
};

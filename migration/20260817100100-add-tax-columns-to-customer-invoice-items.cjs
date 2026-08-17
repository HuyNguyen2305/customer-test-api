'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    const taxColumns = (suffix) => ({
      [`tax${suffix}RateId`]: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'tax_rates', key: 'id' },
        onDelete: 'SET NULL',
      },
      [`tax${suffix}Name`]: { type: DataTypes.STRING, allowNull: true },
      [`tax${suffix}Rate`]: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      [`tax${suffix}Total`]: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    });

    await queryInterface.addColumn('customer_invoice_items', 'subtotal', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    });
    for (const [name, definition] of Object.entries(taxColumns(1))) {
      await queryInterface.addColumn('customer_invoice_items', name, definition);
    }
    for (const [name, definition] of Object.entries(taxColumns(2))) {
      await queryInterface.addColumn('customer_invoice_items', name, definition);
    }
    await queryInterface.addColumn('customer_invoice_items', 'total', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    });
  },

  async down({ context: queryInterface }) {
    for (const suffix of [1, 2]) {
      await queryInterface.removeColumn('customer_invoice_items', `tax${suffix}RateId`);
      await queryInterface.removeColumn('customer_invoice_items', `tax${suffix}Name`);
      await queryInterface.removeColumn('customer_invoice_items', `tax${suffix}Rate`);
      await queryInterface.removeColumn('customer_invoice_items', `tax${suffix}Total`);
    }
    await queryInterface.removeColumn('customer_invoice_items', 'subtotal');
    await queryInterface.removeColumn('customer_invoice_items', 'total');
  },
};

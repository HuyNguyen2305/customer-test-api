'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.dropTable('customer_invoice_taxes');
    await queryInterface.dropTable('customer_estimate_taxes');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    const taxTableColumns = (parentTable) => ({
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      [`${parentTable === 'customer_invoices' ? 'customerInvoiceId' : 'customerEstimateId'}`]: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: parentTable, key: 'id' },
        onDelete: 'CASCADE',
      },
      taxRateId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'tax_rates', key: 'id' },
        onDelete: 'SET NULL',
      },
      name: { type: DataTypes.STRING, allowNull: false },
      code: { type: DataTypes.STRING, allowNull: true },
      rate: { type: DataTypes.DECIMAL(6, 3), allowNull: false, defaultValue: 0 },
      type: { type: DataTypes.STRING, allowNull: true },
      taxableBase: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable('customer_invoice_taxes', taxTableColumns('customer_invoices'));
    await queryInterface.createTable('customer_estimate_taxes', taxTableColumns('customer_estimates'));
  },
};

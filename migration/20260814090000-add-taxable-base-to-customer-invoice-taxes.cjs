'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    // Nullable snapshot of the taxable amount this specific rate applied to,
    // computed once at estimate->invoice generation time from just the items
    // that referenced this taxRateId, proportionally reduced by the invoice's
    // discount. NULL means this row came from attachAutoTax's single-rate
    // path - computeTotals falls back to the invoice-wide taxableAmount for
    // those rows, preserving that path's behavior exactly.
    await queryInterface.addColumn('customer_invoice_taxes', 'taxableBase', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('customer_invoice_taxes', 'taxableBase');
  },
};

'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.removeColumn('customer_invoice_items', 'taxRateId');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.addColumn('customer_invoice_items', 'taxRateId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tax_rates',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    });
  },
};

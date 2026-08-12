'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customer_invoices', 'estimateId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customer_estimates',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    // At most one invoice per estimate; Postgres unique indexes don't constrain
    // NULLs against each other, so non-estimate-sourced invoices are unaffected.
    await queryInterface.addIndex('customer_invoices', ['estimateId'], {
      name: 'customer_invoices_estimate_id_unique',
      unique: true,
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeIndex('customer_invoices', 'customer_invoices_estimate_id_unique');
    await queryInterface.removeColumn('customer_invoices', 'estimateId');
  },
};

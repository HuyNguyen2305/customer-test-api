'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.dropTable('service_invoice_taxes');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.createTable('service_invoice_taxes', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceInvoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'service_invoices',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      taxRateId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'tax_rates',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rate: {
        type: DataTypes.DECIMAL(6, 3),
        allowNull: false,
        defaultValue: 0,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },
};

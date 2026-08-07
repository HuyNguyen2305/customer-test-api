'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('tax_rates', 'code', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('tax_rates', 'rate', {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('tax_rates', 'type', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('tax_rates', 'country', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('tax_rates', 'effectiveFrom', {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('tax_rates', 'effectiveTo', {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('tax_rates', 'effectiveTo');
    await queryInterface.removeColumn('tax_rates', 'effectiveFrom');
    await queryInterface.removeColumn('tax_rates', 'country');
    await queryInterface.removeColumn('tax_rates', 'type');
    await queryInterface.removeColumn('tax_rates', 'rate');
    await queryInterface.removeColumn('tax_rates', 'code');
  },
};

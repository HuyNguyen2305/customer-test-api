'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.removeColumn('tax_rates', 'code');
    await queryInterface.removeColumn('tax_rates', 'type');
    await queryInterface.removeColumn('tax_rates', 'effectiveFrom');
    await queryInterface.removeColumn('tax_rates', 'effectiveTo');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('tax_rates', 'code', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('tax_rates', 'type', {
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
};

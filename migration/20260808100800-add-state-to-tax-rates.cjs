'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.addColumn('tax_rates', 'state', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('tax_rates', 'state');
  },
};

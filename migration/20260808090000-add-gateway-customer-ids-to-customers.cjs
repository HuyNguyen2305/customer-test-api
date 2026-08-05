'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customers', 'squareCustomerId', {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn('customers', 'stripeCustomerId', {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('customers', 'stripeCustomerId');
    await queryInterface.removeColumn('customers', 'squareCustomerId');
  },
};

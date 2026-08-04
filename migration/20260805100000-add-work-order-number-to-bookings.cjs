'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.addColumn('bookings', 'workOrderNumber', {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      unique: true,
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('bookings', 'workOrderNumber');
  },
};

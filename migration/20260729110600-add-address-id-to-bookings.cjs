'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.addColumn('bookings', 'addressId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'addresses',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('bookings', 'addressId');
  },
};

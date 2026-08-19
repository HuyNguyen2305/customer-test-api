'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.removeColumn('customers', 'address');
    await queryInterface.removeColumn('services', 'color');
    await queryInterface.removeColumn('todos', 'completedAt');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customers', 'address', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('services', 'color', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('todos', 'completedAt', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },
};

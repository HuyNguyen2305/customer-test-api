'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customers', 'username', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addIndex('customers', ['username'], { unique: true });

    await queryInterface.changeColumn('customers', 'firstName', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('customers', 'lastName', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('customers', 'email', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.changeColumn('customers', 'email', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('customers', 'lastName', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('customers', 'firstName', {
      type: DataTypes.STRING,
      allowNull: false,
    });

    await queryInterface.removeIndex('customers', ['username']);
    await queryInterface.removeColumn('customers', 'username');
  },
};

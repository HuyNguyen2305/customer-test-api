'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.removeColumn('locations', 'name');
    await queryInterface.removeColumn('pdfs', 'fileSize');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('locations', 'name', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('pdfs', 'fileSize', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  },
};

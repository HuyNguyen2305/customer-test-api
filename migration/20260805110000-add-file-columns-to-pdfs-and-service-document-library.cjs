'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    for (const table of ['pdfs', 'service_document_library']) {
      await queryInterface.addColumn(table, 'filePath', {
        type: DataTypes.STRING,
        allowNull: false,
      });
      await queryInterface.addColumn(table, 'originalFileName', {
        type: DataTypes.STRING,
        allowNull: false,
      });
      await queryInterface.addColumn(table, 'fileSize', {
        type: DataTypes.INTEGER,
        allowNull: false,
      });
    }
  },

  async down({ context: queryInterface }) {
    for (const table of ['pdfs', 'service_document_library']) {
      await queryInterface.removeColumn(table, 'fileSize');
      await queryInterface.removeColumn(table, 'originalFileName');
      await queryInterface.removeColumn(table, 'filePath');
    }
  },
};

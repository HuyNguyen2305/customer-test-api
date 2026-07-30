'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.addColumn('job_materials', 'isCustomized', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('job_todos', 'isCustomized', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('job_materials', 'isCustomized');
    await queryInterface.removeColumn('job_todos', 'isCustomized');
  },
};

'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.createTable('services', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lengthHours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lengthMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      jobCycle: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      setToConfirmed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'archived', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.dropTable('services');
  },
};

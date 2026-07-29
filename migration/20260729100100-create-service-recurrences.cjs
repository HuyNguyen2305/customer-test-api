'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.createTable('service_recurrences', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'services',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      repeatType: {
        type: DataTypes.ENUM('off', 'daily', 'weekly', 'monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'off',
      },
      interval: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      weeklyPeriodType: {
        type: DataTypes.ENUM('1st_3rd', '2nd_4th', 'every'),
        allowNull: true,
      },
      weeklyDays: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      repeatBy: {
        type: DataTypes.ENUM('day_of_week', 'day_of_month', 'day_of_year'),
        allowNull: true,
      },
      endsType: {
        type: DataTypes.ENUM('never', 'after', 'on_date'),
        allowNull: false,
        defaultValue: 'never',
      },
      endsCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      endsDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      exceptType: {
        type: DataTypes.ENUM('off', 'month', 'condition'),
        allowNull: false,
        defaultValue: 'off',
      },
      exceptMonths: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      exceptOrdinal: {
        type: DataTypes.ENUM('1st', '2nd', '3rd', '4th', '5th', 'last'),
        allowNull: true,
      },
      exceptWeekday: {
        type: DataTypes.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
        allowNull: true,
      },
      exceptUnit: {
        type: DataTypes.ENUM('week', 'month'),
        allowNull: true,
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
    await queryInterface.dropTable('service_recurrences');
  },
};

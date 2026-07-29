'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.createTable('service_estimates', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM('basic', 'dynamic', 'package'),
        allowNull: false,
        defaultValue: 'basic',
      },
      templateId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'estimate_templates',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      discountValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountType: {
        type: DataTypes.ENUM('percent', 'flat'),
        allowNull: false,
        defaultValue: 'flat',
      },
      depositValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      depositType: {
        type: DataTypes.ENUM('percent', 'flat'),
        allowNull: false,
        defaultValue: 'flat',
      },
      termsText: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notesText: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      termsTemplateId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'note_templates',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      notesTemplateId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'note_templates',
          key: 'id',
        },
        onDelete: 'RESTRICT',
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
    await queryInterface.dropTable('service_estimates');
  },
};

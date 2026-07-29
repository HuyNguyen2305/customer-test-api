'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.createTable('materials', {
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
      materialId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'materials_master',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      unitsValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      unitsTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'unit_types',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      dilution: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      methodId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'application_methods',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      customMaterialId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'custom_materials',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      locationId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'locations',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      targetPestId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'pests',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.dropTable('materials');
  },
};

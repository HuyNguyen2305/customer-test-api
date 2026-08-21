'use strict';

// Folds custom_materials into materials_master (both were { id, name } only,
// no repository/service ever distinguished them beyond copying the FK
// opaquely) and drops the now-redundant customMaterialId column from
// materials/job_materials - materialId (NOT NULL on both) becomes the single
// reference into the merged catalog. isCustom preserves which rows came from
// custom_materials.
module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('materials_master', 'isCustom', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.sequelize.query(`
      INSERT INTO "materials_master" (id, name, "isCustom", "createdAt", "updatedAt")
      SELECT id, name, true, "createdAt", "updatedAt" FROM "custom_materials"
    `);

    await queryInterface.removeColumn('materials', 'customMaterialId');
    await queryInterface.removeColumn('job_materials', 'customMaterialId');

    await queryInterface.dropTable('custom_materials');
  },

  // Restores table structure exactly (custom_materials recreated with its
  // original rows/ids, customMaterialId columns re-added), but NOT each
  // materials/job_materials row's original customMaterialId value - that
  // link is gone the moment up() drops the column, so there's nothing left
  // to restore it from. Matches this repo's existing precedent for dropping
  // confirmed-dead columns (see 20260819160000-drop-more-dead-columns.cjs):
  // down() undoes the schema change, not necessarily every row's history.
  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.createTable('custom_materials', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
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

    await queryInterface.sequelize.query(`
      INSERT INTO "custom_materials" (id, name, "createdAt", "updatedAt")
      SELECT id, name, "createdAt", "updatedAt" FROM "materials_master" WHERE "isCustom" = true
    `);

    await queryInterface.sequelize.query(`
      DELETE FROM "materials_master" WHERE "isCustom" = true
    `);

    await queryInterface.removeColumn('materials_master', 'isCustom');

    await queryInterface.addColumn('materials', 'customMaterialId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'custom_materials',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    });

    await queryInterface.addColumn('job_materials', 'customMaterialId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'custom_materials',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    });
  },
};

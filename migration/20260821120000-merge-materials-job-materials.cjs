'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    // Materials now doubles as both a reusable per-service template
    // (serviceId set) and a per-booking snapshot copy of one (bookingId
    // set) - exactly one is non-null per row, enforced below via a CHECK
    // constraint. Same shape as the todo_lists/job_todo_lists merge.
    await queryInterface.changeColumn('materials', 'serviceId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('materials', 'bookingId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'bookings', key: 'id' },
      onDelete: 'CASCADE',
    });
    await queryInterface.addColumn('materials', 'isCustomized', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Preserve original ids - no id-remap needed for downstream FKs.
    await queryInterface.sequelize.query(`
      INSERT INTO "materials" (id, "bookingId", "materialId", "unitsValue", "unitsTypeId", dilution, "methodId", "locationId", "targetPestId", "sortOrder", "isCustomized", "createdAt", "updatedAt")
      SELECT id, "bookingId", "materialId", "unitsValue", "unitsTypeId", dilution, "methodId", "locationId", "targetPestId", "sortOrder", "isCustomized", "createdAt", "updatedAt" FROM "job_materials"
    `);

    // Added after backfill so it validates against fully-populated data in
    // one pass, rather than against partially-migrated rows mid-migration.
    await queryInterface.sequelize.query(`
      ALTER TABLE "materials" ADD CONSTRAINT "materials_owner_check"
      CHECK ((("serviceId" IS NOT NULL)::int + ("bookingId" IS NOT NULL)::int) = 1)
    `);

    await queryInterface.dropTable('job_materials');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.sequelize.query(`ALTER TABLE "materials" DROP CONSTRAINT "materials_owner_check"`);

    await queryInterface.createTable('job_materials', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'bookings', key: 'id' },
        onDelete: 'CASCADE',
      },
      materialId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'materials_master', key: 'id' },
        onDelete: 'RESTRICT',
      },
      unitsValue: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      unitsTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'unit_types', key: 'id' },
        onDelete: 'RESTRICT',
      },
      dilution: { type: DataTypes.TEXT, allowNull: true },
      methodId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'application_methods', key: 'id' },
        onDelete: 'RESTRICT',
      },
      locationId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onDelete: 'RESTRICT',
      },
      targetPestId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'pests', key: 'id' },
        onDelete: 'RESTRICT',
      },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      isCustomized: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.sequelize.query(`
      INSERT INTO "job_materials" (id, "bookingId", "materialId", "unitsValue", "unitsTypeId", dilution, "methodId", "locationId", "targetPestId", "sortOrder", "isCustomized", "createdAt", "updatedAt")
      SELECT id, "bookingId", "materialId", "unitsValue", "unitsTypeId", dilution, "methodId", "locationId", "targetPestId", "sortOrder", "isCustomized", "createdAt", "updatedAt" FROM "materials" WHERE "bookingId" IS NOT NULL
    `);

    await queryInterface.sequelize.query(`DELETE FROM "materials" WHERE "bookingId" IS NOT NULL`);

    await queryInterface.removeColumn('materials', 'isCustomized');
    await queryInterface.removeColumn('materials', 'bookingId');
    await queryInterface.changeColumn('materials', 'serviceId', {
      type: DataTypes.UUID,
      allowNull: false,
    });
  },
};

'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    // TodoList now doubles as both a reusable checklist template (serviceId
    // set) and a per-booking snapshot copy of one (bookingId set) - exactly
    // one is non-null per row, enforced below via a CHECK constraint.
    await queryInterface.changeColumn('todo_lists', 'serviceId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('todo_lists', 'bookingId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'bookings', key: 'id' },
      onDelete: 'CASCADE',
    });

    // Same columns job_todos already has - only meaningful on rows whose
    // todoListId points at a bookingId-owned TodoList.
    await queryInterface.addColumn('todos', 'completed', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('todos', 'completedAt', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('todos', 'isCustomized', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Preserve original ids on both sides - uuid collision between two
    // independently-generated tables is not a real concern, and preserving
    // ids means no id-remap step is needed for the FK between them.
    await queryInterface.sequelize.query(`
      INSERT INTO "todo_lists" (id, "bookingId", name, "sortOrder", "createdAt", "updatedAt")
      SELECT id, "bookingId", name, "sortOrder", "createdAt", "updatedAt" FROM "job_todo_lists"
    `);
    await queryInterface.sequelize.query(`
      INSERT INTO "todos" (id, "todoListId", text, "sortOrder", completed, "completedAt", "isCustomized", "createdAt", "updatedAt")
      SELECT id, "jobTodoListId", text, "sortOrder", completed, "completedAt", "isCustomized", "createdAt", "updatedAt" FROM "job_todos"
    `);

    // Added after backfill so it validates against fully-populated data in
    // one pass, rather than against partially-migrated rows mid-migration.
    await queryInterface.sequelize.query(`
      ALTER TABLE "todo_lists" ADD CONSTRAINT "todo_lists_owner_check"
      CHECK ((("serviceId" IS NOT NULL)::int + ("bookingId" IS NOT NULL)::int) = 1)
    `);

    await queryInterface.dropTable('job_todos');
    await queryInterface.dropTable('job_todo_lists');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.sequelize.query(`ALTER TABLE "todo_lists" DROP CONSTRAINT "todo_lists_owner_check"`);

    await queryInterface.createTable('job_todo_lists', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'bookings', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: DataTypes.STRING, allowNull: false },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.createTable('job_todos', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      jobTodoListId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'job_todo_lists', key: 'id' },
        onDelete: 'CASCADE',
      },
      text: { type: DataTypes.STRING, allowNull: false },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      isCustomized: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.sequelize.query(`
      INSERT INTO "job_todo_lists" (id, "bookingId", name, "sortOrder", "createdAt", "updatedAt")
      SELECT id, "bookingId", name, "sortOrder", "createdAt", "updatedAt" FROM "todo_lists" WHERE "bookingId" IS NOT NULL
    `);
    await queryInterface.sequelize.query(`
      INSERT INTO "job_todos" (id, "jobTodoListId", text, "sortOrder", completed, "completedAt", "isCustomized", "createdAt", "updatedAt")
      SELECT t.id, t."todoListId", t.text, t."sortOrder", t.completed, t."completedAt", t."isCustomized", t."createdAt", t."updatedAt"
      FROM "todos" t JOIN "todo_lists" tl ON tl.id = t."todoListId"
      WHERE tl."bookingId" IS NOT NULL
    `);

    await queryInterface.sequelize.query(`
      DELETE FROM "todos" WHERE "todoListId" IN (SELECT id FROM "todo_lists" WHERE "bookingId" IS NOT NULL)
    `);
    await queryInterface.sequelize.query(`DELETE FROM "todo_lists" WHERE "bookingId" IS NOT NULL`);

    await queryInterface.removeColumn('todos', 'isCustomized');
    await queryInterface.removeColumn('todos', 'completedAt');
    await queryInterface.removeColumn('todos', 'completed');
    await queryInterface.removeColumn('todo_lists', 'bookingId');
    await queryInterface.changeColumn('todo_lists', 'serviceId', {
      type: DataTypes.UUID,
      allowNull: false,
    });
  },
};

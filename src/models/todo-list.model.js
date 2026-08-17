export default (sequelize, DataTypes) => {
  sequelize.define(
    'TodoList',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // Exactly one of serviceId/bookingId is set (DB-enforced via a CHECK
      // constraint): serviceId marks a reusable checklist template, bookingId
      // marks a per-job snapshot copy of one - see the merge migration.
      serviceId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'todo_lists',
    },
  );
};

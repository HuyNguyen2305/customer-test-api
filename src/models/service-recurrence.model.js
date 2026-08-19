export default (sequelize, DataTypes) => {
  sequelize.define(
    'ServiceRecurrence',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      recurrenceRule: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      tableName: 'service_recurrences',
    },
  );
};

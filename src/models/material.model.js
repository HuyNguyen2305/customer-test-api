export default (sequelize, DataTypes) => {
  sequelize.define(
    'Material',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      materialId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      unitsValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      unitsTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      dilution: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      methodId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      locationId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      targetPestId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isCustomized: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'materials',
    },
  );
};

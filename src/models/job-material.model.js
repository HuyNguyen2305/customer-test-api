export default (sequelize, DataTypes) => {
  sequelize.define(
    'JobMaterial',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
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
      customMaterialId: {
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
      tableName: 'job_materials',
    },
  );
};

export default (sequelize, DataTypes) => {
  sequelize.define(
    'UnitType',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'unit_types',
    },
  );
};

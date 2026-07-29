export default (sequelize, DataTypes) => {
  sequelize.define(
    'CustomMaterial',
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
      tableName: 'custom_materials',
    },
  );
};

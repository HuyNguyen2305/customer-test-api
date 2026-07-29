export default (sequelize, DataTypes) => {
  sequelize.define(
    'EstimateTemplate',
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
      type: {
        type: DataTypes.ENUM('basic', 'dynamic', 'package'),
        allowNull: false,
        defaultValue: 'basic',
      },
    },
    {
      tableName: 'estimate_templates',
    },
  );
};

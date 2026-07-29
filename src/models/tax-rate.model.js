export default (sequelize, DataTypes) => {
  sequelize.define(
    'TaxRate',
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
      tableName: 'tax_rates',
    },
  );
};

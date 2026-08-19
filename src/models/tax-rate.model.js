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
      rate: {
        type: DataTypes.DECIMAL(6, 3),
        allowNull: false,
        defaultValue: 0,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'tax_rates',
    },
  );
};

export default (sequelize, DataTypes) => {
  sequelize.define(
    'CustomerEstimateItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerEstimateId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      tax1RateId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      tax1Name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tax1Rate: {
        type: DataTypes.DECIMAL(6, 3),
        allowNull: true,
      },
      tax1Total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      tax2RateId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      tax2Name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tax2Rate: {
        type: DataTypes.DECIMAL(6, 3),
        allowNull: true,
      },
      tax2Total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
    },
    {
      tableName: 'customer_estimate_items',
    },
  );
};

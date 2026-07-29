export default (sequelize, DataTypes) => {
  sequelize.define(
    'PaymentOption',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      gateway: {
        type: DataTypes.ENUM('stripe', 'square'),
        allowNull: false,
      },
      externalId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'payment_options',
    },
  );
};

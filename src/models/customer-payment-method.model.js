export default (sequelize, DataTypes) => {
  sequelize.define(
    'CustomerPaymentMethod',
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
      type: {
        type: DataTypes.ENUM('card', 'bank', 'other'),
        allowNull: false,
      },
      token: {
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
      tableName: 'customer_payment_methods',
      indexes: [
        {
          unique: true,
          fields: ['customerId'],
          where: { isDefault: true },
          name: 'customer_payment_methods_customer_id_default_unique_idx',
        },
      ],
    },
  );
};

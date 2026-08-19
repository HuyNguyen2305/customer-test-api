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
        type: DataTypes.ENUM('card', 'bank', 'other', 'open_credit'),
        allowNull: false,
      },
      // Gateway/credit fields, keyed by row type: card/bank rows carry token+gateway+
      // gatewayCustomerId (a denormalized copy of customers.squareCustomerId/stripeCustomerId,
      // read at charge time to avoid a second Customer lookup per payment); open_credit rows
      // carry creditBalance instead. The two shapes never overlap on the same row.
      paymentDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
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
        {
          unique: true,
          fields: ['customerId'],
          where: { type: 'open_credit' },
          name: 'customer_payment_methods_customer_id_open_credit_unique_idx',
        },
      ],
    },
  );
};

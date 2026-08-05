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
      // Gateway card-on-file id (Square card id / Stripe PaymentMethod id). Null for
      // 'open_credit' rows, which have no external processor.
      token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gateway: {
        type: DataTypes.ENUM('stripe', 'square'),
        allowNull: true,
      },
      // Denormalized copy of customers.squareCustomerId/stripeCustomerId for this row's
      // gateway, read at charge time to avoid a second Customer lookup per payment.
      gatewayCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Only populated on 'open_credit' rows — the available store-credit amount.
      creditBalance: {
        type: DataTypes.DECIMAL(12, 2),
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

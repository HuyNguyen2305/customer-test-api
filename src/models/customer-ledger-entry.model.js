export default (sequelize, DataTypes) => {
  sequelize.define(
    'CustomerLedgerEntry',
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
        type: DataTypes.ENUM('charge', 'payment', 'adjustment', 'refund'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      // Polymorphic reference (e.g. a customer_invoice or customer_payment_method id) -
      // the spec leaves the target table unspecified, so no DB-level FK is applied here.
      referenceId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'customer_ledger_entries',
      updatedAt: false,
    },
  );
};

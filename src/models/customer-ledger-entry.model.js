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
      // References customer_invoices.id (both charge and payment entries are
      // recorded against an invoice today; enforced via a DB-level FK).
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

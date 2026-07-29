export default (sequelize, DataTypes) => {
  sequelize.define(
    'CustomerInvoice',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sourceInvoiceId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      discountValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountType: {
        type: DataTypes.ENUM('percent', 'flat'),
        allowNull: false,
        defaultValue: 'flat',
      },
      termsText: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notesText: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue'),
        allowNull: false,
        defaultValue: 'draft',
      },
      balanceDue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'customer_invoices',
    },
  );
};

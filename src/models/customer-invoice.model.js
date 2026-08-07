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
      addressId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      addressLabel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressLine1: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressLine2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressState: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressZip: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressCountry: {
        type: DataTypes.STRING,
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
        type: DataTypes.ENUM('draft', 'sent', 'void', 'write_off', 'paid'),
        allowNull: false,
        defaultValue: 'draft',
      },
      balanceDue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      // True only for the single invoice created by generateInitialInvoice for a
      // booking; recurring follow-up invoices leave this false so they can share
      // the same bookingId (see the partial unique index on this + bookingId).
      isInitial: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'customer_invoices',
    },
  );
};

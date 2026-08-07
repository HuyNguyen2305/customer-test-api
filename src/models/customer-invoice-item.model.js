export default (sequelize, DataTypes) => {
  sequelize.define(
    'CustomerInvoiceItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerInvoiceId: {
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
    },
    {
      tableName: 'customer_invoice_items',
    },
  );
};

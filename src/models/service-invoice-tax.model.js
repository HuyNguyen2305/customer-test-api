export default (sequelize, DataTypes) => {
  sequelize.define(
    'ServiceInvoiceTax',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceInvoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      taxRateId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rate: {
        type: DataTypes.DECIMAL(6, 3),
        allowNull: false,
        defaultValue: 0,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'service_invoice_taxes',
    },
  );
};

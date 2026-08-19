export default (sequelize, DataTypes) => {
  sequelize.define(
    'InvoiceFrequency',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceInvoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      recurrenceRule: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM(
          'none',
          'send_email',
          'send_email_cc',
          'send_sms',
          'send_email_sms',
          'charge_to',
          'charge_to_send_receipt',
        ),
        allowNull: false,
        defaultValue: 'none',
      },
    },
    {
      tableName: 'invoice_frequencies',
    },
  );
};

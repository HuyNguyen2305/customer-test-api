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
      repeatType: {
        type: DataTypes.ENUM('repeat_with_job', 'weekly', 'monthly', 'yearly', 'does_not_repeat'),
        allowNull: false,
        defaultValue: 'repeat_with_job',
      },
      interval: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      weeklyPeriodType: {
        type: DataTypes.ENUM('1st_3rd', '2nd_4th', 'every'),
        allowNull: true,
      },
      weeklyDays: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      repeatBy: {
        type: DataTypes.ENUM('day_of_week', 'day_of_month', 'day_of_year'),
        allowNull: true,
      },
      endsType: {
        type: DataTypes.ENUM('never', 'after', 'on_date'),
        allowNull: false,
        defaultValue: 'never',
      },
      endsCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      endsDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      invoiceDate: {
        type: DataTypes.DATEONLY,
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

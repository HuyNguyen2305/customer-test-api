export default (sequelize, DataTypes) => {
  sequelize.define(
    'ServiceInvoice',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      repeatsWithJob: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      termsTemplateId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      notesTemplateId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'service_invoices',
    },
  );
};

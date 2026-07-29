export default (sequelize, DataTypes) => {
  sequelize.define(
    'ServiceEstimate',
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
      // Open Question #4 (spec): Dynamic/Package estimates may need distinct sub-fields
      // beyond Basic. Intentionally deferred - not enough source detail yet. No sub-tables
      // exist for 'dynamic'/'package' beyond this enum value.
      type: {
        type: DataTypes.ENUM('basic', 'dynamic', 'package'),
        allowNull: false,
        defaultValue: 'basic',
      },
      templateId: {
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
      depositValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      depositType: {
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
      tableName: 'service_estimates',
    },
  );
};

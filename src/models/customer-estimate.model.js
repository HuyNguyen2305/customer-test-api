export default (sequelize, DataTypes) => {
  sequelize.define(
    'CustomerEstimate',
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
      sourceEstimateId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      // Open Question #4 (spec): Dynamic/Package estimates may need distinct sub-fields
      // beyond Basic. Intentionally deferred - not enough source detail yet.
      type: {
        type: DataTypes.ENUM('basic', 'dynamic', 'package'),
        allowNull: false,
        defaultValue: 'basic',
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
      status: {
        type: DataTypes.ENUM('draft', 'sent', 'approved', 'declined', 'expired'),
        allowNull: false,
        defaultValue: 'draft',
      },
    },
    {
      tableName: 'customer_estimates',
    },
  );
};

export default (sequelize, DataTypes) => {
  sequelize.define(
    'CustomerDocument',
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
      bookingId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      documentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      pdfId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('doc', 'pdf'),
        allowNull: false,
      },
    },
    {
      tableName: 'customer_documents',
    },
  );
};

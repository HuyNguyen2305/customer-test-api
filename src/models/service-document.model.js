export default (sequelize, DataTypes) => {
  sequelize.define(
    'ServiceDocument',
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
      tableName: 'service_documents',
    },
  );
};

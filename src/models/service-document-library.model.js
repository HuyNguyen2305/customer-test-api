export default (sequelize, DataTypes) => {
  sequelize.define(
    'ServiceDocumentLibrary',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'service_document_library',
    },
  );
};

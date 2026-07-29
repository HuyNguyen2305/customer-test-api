export default (sequelize, DataTypes) => {
  sequelize.define(
    'Pdf',
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
      tableName: 'pdfs',
    },
  );
};

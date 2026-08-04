export default (sequelize, DataTypes) => {
  sequelize.define(
    'RevokedToken',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      jti: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'revoked_tokens',
    },
  );
};

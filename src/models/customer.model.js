export default (sequelize, DataTypes) => {
  sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      // @deprecated superseded by the addresses table (Address model). Kept for now,
      // scheduled for removal once nothing reads from it directly.
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      mobile: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isRegistered: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'customers',
    },
  );
};

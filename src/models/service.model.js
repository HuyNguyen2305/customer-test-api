export default (sequelize, DataTypes) => {
  sequelize.define(
    'Service',
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
      lengthHours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lengthMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      jobCycle: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      setToConfirmed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'archived', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'services',
    },
  );
};

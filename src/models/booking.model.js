export default (sequelize, DataTypes) => {
  sequelize.define(
    'Booking',
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
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      addressId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      workOrderNumber: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'bookings',
    },
  );
};

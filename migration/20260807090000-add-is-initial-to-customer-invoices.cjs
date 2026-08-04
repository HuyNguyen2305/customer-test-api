'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customer_invoices', 'isInitial', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Partial unique index: at most one "initial" invoice per booking, while
    // recurring invoices (isInitial = false) can share a bookingId freely.
    await queryInterface.addIndex('customer_invoices', ['bookingId'], {
      name: 'customer_invoices_booking_id_is_initial_unique',
      unique: true,
      where: { isInitial: true },
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeIndex('customer_invoices', 'customer_invoices_booking_id_is_initial_unique');
    await queryInterface.removeColumn('customer_invoices', 'isInitial');
  },
};

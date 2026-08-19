'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.addIndex('bookings', ['customerId', 'status', 'startTime'], {
      name: 'bookings_customer_id_status_start_time_idx',
    });
    await queryInterface.addIndex('bookings', ['status'], {
      name: 'bookings_status_idx',
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeIndex('bookings', 'bookings_customer_id_status_start_time_idx');
    await queryInterface.removeIndex('bookings', 'bookings_status_idx');
  },
};

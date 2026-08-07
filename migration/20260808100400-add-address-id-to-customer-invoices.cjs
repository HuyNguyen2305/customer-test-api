'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customer_invoices', 'addressId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'addresses',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    await queryInterface.sequelize.query(`
      UPDATE "customer_invoices" ci
      SET "addressId" = b."addressId"
      FROM "bookings" b
      WHERE b."id" = ci."bookingId" AND b."addressId" IS NOT NULL
    `);
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('customer_invoices', 'addressId');
  },
};

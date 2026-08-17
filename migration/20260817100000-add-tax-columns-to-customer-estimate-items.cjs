'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    const taxColumns = (suffix) => ({
      [`tax${suffix}RateId`]: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'tax_rates', key: 'id' },
        onDelete: 'SET NULL',
      },
      [`tax${suffix}Name`]: { type: DataTypes.STRING, allowNull: true },
      [`tax${suffix}Rate`]: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      [`tax${suffix}Total`]: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    });

    await queryInterface.addColumn('customer_estimate_items', 'subtotal', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    });
    for (const [name, definition] of Object.entries(taxColumns(1))) {
      await queryInterface.addColumn('customer_estimate_items', name, definition);
    }
    for (const [name, definition] of Object.entries(taxColumns(2))) {
      await queryInterface.addColumn('customer_estimate_items', name, definition);
    }
    await queryInterface.addColumn('customer_estimate_items', 'total', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    });

    // Preserve existing per-item tax assignments (the old single taxRateId
    // column) as tax1RateId before dropping it - tax1Name/tax1Rate/subtotal/
    // total get filled in on the next read via the app's compute-and-cache
    // path, not here.
    await queryInterface.sequelize.query(
      `UPDATE "customer_estimate_items" SET "tax1RateId" = "taxRateId" WHERE "taxRateId" IS NOT NULL`,
    );
    await queryInterface.removeColumn('customer_estimate_items', 'taxRateId');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.addColumn('customer_estimate_items', 'taxRateId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'tax_rates', key: 'id' },
      onDelete: 'RESTRICT',
    });
    await queryInterface.sequelize.query(
      `UPDATE "customer_estimate_items" SET "taxRateId" = "tax1RateId" WHERE "tax1RateId" IS NOT NULL`,
    );

    for (const suffix of [1, 2]) {
      await queryInterface.removeColumn('customer_estimate_items', `tax${suffix}RateId`);
      await queryInterface.removeColumn('customer_estimate_items', `tax${suffix}Name`);
      await queryInterface.removeColumn('customer_estimate_items', `tax${suffix}Rate`);
      await queryInterface.removeColumn('customer_estimate_items', `tax${suffix}Total`);
    }
    await queryInterface.removeColumn('customer_estimate_items', 'subtotal');
    await queryInterface.removeColumn('customer_estimate_items', 'total');
  },
};

'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customer_invoice_items', 'taxSlots', {
      type: DataTypes.JSONB,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "customer_invoice_items" SET "taxSlots" = jsonb_build_object(
        'tax1RateId', "tax1RateId",
        'tax1Name', "tax1Name",
        'tax1Rate', "tax1Rate",
        'tax1Total', "tax1Total",
        'tax2RateId', "tax2RateId",
        'tax2Name', "tax2Name",
        'tax2Rate', "tax2Rate",
        'tax2Total', "tax2Total"
      )
      WHERE "tax1RateId" IS NOT NULL OR "tax2RateId" IS NOT NULL
    `);

    await queryInterface.removeColumn('customer_invoice_items', 'tax1RateId');
    await queryInterface.removeColumn('customer_invoice_items', 'tax1Name');
    await queryInterface.removeColumn('customer_invoice_items', 'tax1Rate');
    await queryInterface.removeColumn('customer_invoice_items', 'tax1Total');
    await queryInterface.removeColumn('customer_invoice_items', 'tax2RateId');
    await queryInterface.removeColumn('customer_invoice_items', 'tax2Name');
    await queryInterface.removeColumn('customer_invoice_items', 'tax2Rate');
    await queryInterface.removeColumn('customer_invoice_items', 'tax2Total');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('customer_invoice_items', 'tax1RateId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoice_items', 'tax1Name', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoice_items', 'tax1Rate', {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoice_items', 'tax1Total', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoice_items', 'tax2RateId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoice_items', 'tax2Name', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoice_items', 'tax2Rate', {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: true,
    });
    await queryInterface.addColumn('customer_invoice_items', 'tax2Total', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "customer_invoice_items" SET
        "tax1RateId" = ("taxSlots"->>'tax1RateId')::uuid,
        "tax1Name" = "taxSlots"->>'tax1Name',
        "tax1Rate" = ("taxSlots"->>'tax1Rate')::numeric,
        "tax1Total" = ("taxSlots"->>'tax1Total')::numeric,
        "tax2RateId" = ("taxSlots"->>'tax2RateId')::uuid,
        "tax2Name" = "taxSlots"->>'tax2Name',
        "tax2Rate" = ("taxSlots"->>'tax2Rate')::numeric,
        "tax2Total" = ("taxSlots"->>'tax2Total')::numeric
      WHERE "taxSlots" IS NOT NULL
    `);

    await queryInterface.removeColumn('customer_invoice_items', 'taxSlots');
  },
};

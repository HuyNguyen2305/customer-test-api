'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('invoice_frequencies', 'recurrenceRule', {
      type: DataTypes.JSONB,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "invoice_frequencies" SET "recurrenceRule" = jsonb_build_object(
        'repeatType', "repeatType",
        'interval', "interval",
        'weeklyPeriodType', "weeklyPeriodType",
        'weeklyDays', to_jsonb("weeklyDays"),
        'repeatBy', "repeatBy",
        'endsType', "endsType",
        'endsCount', "endsCount",
        'endsDate', "endsDate"
      )
    `);

    await queryInterface.changeColumn('invoice_frequencies', 'recurrenceRule', {
      type: DataTypes.JSONB,
      allowNull: false,
    });

    await queryInterface.removeColumn('invoice_frequencies', 'repeatType');
    await queryInterface.removeColumn('invoice_frequencies', 'interval');
    await queryInterface.removeColumn('invoice_frequencies', 'weeklyPeriodType');
    await queryInterface.removeColumn('invoice_frequencies', 'weeklyDays');
    await queryInterface.removeColumn('invoice_frequencies', 'repeatBy');
    await queryInterface.removeColumn('invoice_frequencies', 'endsType');
    await queryInterface.removeColumn('invoice_frequencies', 'endsCount');
    await queryInterface.removeColumn('invoice_frequencies', 'endsDate');
    await queryInterface.removeColumn('invoice_frequencies', 'invoiceDate');

    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_invoice_frequencies_repeatType"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_invoice_frequencies_weeklyPeriodType"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_invoice_frequencies_repeatBy"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_invoice_frequencies_endsType"`);
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('invoice_frequencies', 'repeatType', {
      type: DataTypes.ENUM('repeat_with_job', 'weekly', 'monthly', 'yearly', 'does_not_repeat'),
      allowNull: true,
    });
    await queryInterface.addColumn('invoice_frequencies', 'interval', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('invoice_frequencies', 'weeklyPeriodType', {
      type: DataTypes.ENUM('1st_3rd', '2nd_4th', 'every'),
      allowNull: true,
    });
    await queryInterface.addColumn('invoice_frequencies', 'weeklyDays', {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    });
    await queryInterface.addColumn('invoice_frequencies', 'repeatBy', {
      type: DataTypes.ENUM('day_of_week', 'day_of_month', 'day_of_year'),
      allowNull: true,
    });
    await queryInterface.addColumn('invoice_frequencies', 'endsType', {
      type: DataTypes.ENUM('never', 'after', 'on_date'),
      allowNull: true,
    });
    await queryInterface.addColumn('invoice_frequencies', 'endsCount', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('invoice_frequencies', 'endsDate', {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('invoice_frequencies', 'invoiceDate', {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "invoice_frequencies" SET
        "repeatType" = "recurrenceRule"->>'repeatType',
        "interval" = ("recurrenceRule"->>'interval')::int,
        "weeklyPeriodType" = "recurrenceRule"->>'weeklyPeriodType',
        "weeklyDays" = CASE WHEN jsonb_typeof("recurrenceRule"->'weeklyDays') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text("recurrenceRule"->'weeklyDays'))
          ELSE NULL END,
        "repeatBy" = "recurrenceRule"->>'repeatBy',
        "endsType" = "recurrenceRule"->>'endsType',
        "endsCount" = ("recurrenceRule"->>'endsCount')::int,
        "endsDate" = ("recurrenceRule"->>'endsDate')::date
    `);

    await queryInterface.changeColumn('invoice_frequencies', 'repeatType', {
      type: DataTypes.ENUM('repeat_with_job', 'weekly', 'monthly', 'yearly', 'does_not_repeat'),
      allowNull: false,
      defaultValue: 'repeat_with_job',
    });
    await queryInterface.changeColumn('invoice_frequencies', 'interval', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
    await queryInterface.changeColumn('invoice_frequencies', 'endsType', {
      type: DataTypes.ENUM('never', 'after', 'on_date'),
      allowNull: false,
      defaultValue: 'never',
    });
    // invoiceDate's original data was dropped by `up` with no backfill source (it was
    // confirmed unused before this migration), so it's restored nullable rather than
    // reconstructed with a fabricated value.

    await queryInterface.removeColumn('invoice_frequencies', 'recurrenceRule');
  },
};

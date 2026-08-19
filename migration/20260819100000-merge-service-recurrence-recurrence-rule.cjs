'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('service_recurrences', 'recurrenceRule', {
      type: DataTypes.JSONB,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "service_recurrences" SET "recurrenceRule" = jsonb_build_object(
        'repeatType', "repeatType",
        'interval', "interval",
        'weeklyPeriodType', "weeklyPeriodType",
        'weeklyDays', to_jsonb("weeklyDays"),
        'repeatBy', "repeatBy",
        'endsType', "endsType",
        'endsCount', "endsCount",
        'endsDate', "endsDate",
        'exceptType', "exceptType",
        'exceptMonths', to_jsonb("exceptMonths"),
        'exceptOrdinal', "exceptOrdinal",
        'exceptWeekday', "exceptWeekday",
        'exceptUnit', "exceptUnit"
      )
    `);

    await queryInterface.changeColumn('service_recurrences', 'recurrenceRule', {
      type: DataTypes.JSONB,
      allowNull: false,
    });

    await queryInterface.removeColumn('service_recurrences', 'repeatType');
    await queryInterface.removeColumn('service_recurrences', 'interval');
    await queryInterface.removeColumn('service_recurrences', 'weeklyPeriodType');
    await queryInterface.removeColumn('service_recurrences', 'weeklyDays');
    await queryInterface.removeColumn('service_recurrences', 'repeatBy');
    await queryInterface.removeColumn('service_recurrences', 'endsType');
    await queryInterface.removeColumn('service_recurrences', 'endsCount');
    await queryInterface.removeColumn('service_recurrences', 'endsDate');
    await queryInterface.removeColumn('service_recurrences', 'exceptType');
    await queryInterface.removeColumn('service_recurrences', 'exceptMonths');
    await queryInterface.removeColumn('service_recurrences', 'exceptOrdinal');
    await queryInterface.removeColumn('service_recurrences', 'exceptWeekday');
    await queryInterface.removeColumn('service_recurrences', 'exceptUnit');

    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_service_recurrences_repeatType"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_service_recurrences_weeklyPeriodType"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_service_recurrences_repeatBy"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_service_recurrences_endsType"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_service_recurrences_exceptType"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_service_recurrences_exceptOrdinal"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_service_recurrences_exceptWeekday"`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_service_recurrences_exceptUnit"`);
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.addColumn('service_recurrences', 'repeatType', {
      type: DataTypes.ENUM('off', 'daily', 'weekly', 'monthly', 'yearly'),
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'interval', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'weeklyPeriodType', {
      type: DataTypes.ENUM('1st_3rd', '2nd_4th', 'every'),
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'weeklyDays', {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'repeatBy', {
      type: DataTypes.ENUM('day_of_week', 'day_of_month', 'day_of_year'),
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'endsType', {
      type: DataTypes.ENUM('never', 'after', 'on_date'),
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'endsCount', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'endsDate', {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'exceptType', {
      type: DataTypes.ENUM('off', 'month', 'condition'),
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'exceptMonths', {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'exceptOrdinal', {
      type: DataTypes.ENUM('1st', '2nd', '3rd', '4th', '5th', 'last'),
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'exceptWeekday', {
      type: DataTypes.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
      allowNull: true,
    });
    await queryInterface.addColumn('service_recurrences', 'exceptUnit', {
      type: DataTypes.ENUM('week', 'month'),
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "service_recurrences" SET
        "repeatType" = "recurrenceRule"->>'repeatType',
        "interval" = ("recurrenceRule"->>'interval')::int,
        "weeklyPeriodType" = "recurrenceRule"->>'weeklyPeriodType',
        "weeklyDays" = CASE WHEN jsonb_typeof("recurrenceRule"->'weeklyDays') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text("recurrenceRule"->'weeklyDays'))
          ELSE NULL END,
        "repeatBy" = "recurrenceRule"->>'repeatBy',
        "endsType" = "recurrenceRule"->>'endsType',
        "endsCount" = ("recurrenceRule"->>'endsCount')::int,
        "endsDate" = ("recurrenceRule"->>'endsDate')::date,
        "exceptType" = "recurrenceRule"->>'exceptType',
        "exceptMonths" = CASE WHEN jsonb_typeof("recurrenceRule"->'exceptMonths') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text("recurrenceRule"->'exceptMonths'))
          ELSE NULL END,
        "exceptOrdinal" = "recurrenceRule"->>'exceptOrdinal',
        "exceptWeekday" = "recurrenceRule"->>'exceptWeekday',
        "exceptUnit" = "recurrenceRule"->>'exceptUnit'
    `);

    await queryInterface.changeColumn('service_recurrences', 'repeatType', {
      type: DataTypes.ENUM('off', 'daily', 'weekly', 'monthly', 'yearly'),
      allowNull: false,
      defaultValue: 'off',
    });
    await queryInterface.changeColumn('service_recurrences', 'interval', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
    await queryInterface.changeColumn('service_recurrences', 'endsType', {
      type: DataTypes.ENUM('never', 'after', 'on_date'),
      allowNull: false,
      defaultValue: 'never',
    });
    await queryInterface.changeColumn('service_recurrences', 'exceptType', {
      type: DataTypes.ENUM('off', 'month', 'condition'),
      allowNull: false,
      defaultValue: 'off',
    });

    await queryInterface.removeColumn('service_recurrences', 'recurrenceRule');
  },
};

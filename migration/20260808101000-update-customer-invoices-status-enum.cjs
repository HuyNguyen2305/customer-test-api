'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_customer_invoices_status" RENAME TO "enum_customer_invoices_status_old";
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_customer_invoices_status" AS ENUM ('draft', 'sent', 'void', 'write_off', 'paid');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "customer_invoices"
      ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "enum_customer_invoices_status"
        USING (CASE status::text WHEN 'overdue' THEN 'sent' ELSE status::text END)::"enum_customer_invoices_status",
      ALTER COLUMN "status" SET DEFAULT 'draft';
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_customer_invoices_status_old";
    `);
  },

  async down({ context: queryInterface }) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_customer_invoices_status" RENAME TO "enum_customer_invoices_status_new";
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_customer_invoices_status" AS ENUM ('draft', 'sent', 'paid', 'overdue');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "customer_invoices"
      ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "enum_customer_invoices_status"
        USING (CASE status::text WHEN 'void' THEN 'sent' WHEN 'write_off' THEN 'sent' ELSE status::text END)::"enum_customer_invoices_status",
      ALTER COLUMN "status" SET DEFAULT 'draft';
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_customer_invoices_status_new";
    `);
  },
};

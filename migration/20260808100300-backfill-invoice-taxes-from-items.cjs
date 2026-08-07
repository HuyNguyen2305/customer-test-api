'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { randomUUID } = require('crypto');
    const { QueryTypes } = require('sequelize');
    const now = new Date();

    const customerPairs = await queryInterface.sequelize.query(
      `SELECT DISTINCT ci."customerInvoiceId" AS "invoiceId", tr."id" AS "taxRateId",
              tr."name", tr."rate"
       FROM "customer_invoice_items" ci
       JOIN "tax_rates" tr ON tr."id" = ci."taxRateId"
       WHERE ci."taxRateId" IS NOT NULL`,
      { type: QueryTypes.SELECT },
    );

    if (customerPairs.length) {
      await queryInterface.bulkInsert(
        'customer_invoice_taxes',
        customerPairs.map((row) => ({
          id: randomUUID(),
          customerInvoiceId: row.invoiceId,
          taxRateId: row.taxRateId,
          name: row.name,
          code: null,
          rate: row.rate,
          type: null,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    const servicePairs = await queryInterface.sequelize.query(
      `SELECT DISTINCT ii."serviceInvoiceId" AS "invoiceId", tr."id" AS "taxRateId",
              tr."name", tr."rate"
       FROM "invoice_items" ii
       JOIN "tax_rates" tr ON tr."id" = ii."taxRateId"
       WHERE ii."taxRateId" IS NOT NULL`,
      { type: QueryTypes.SELECT },
    );

    if (servicePairs.length) {
      await queryInterface.bulkInsert(
        'service_invoice_taxes',
        servicePairs.map((row) => ({
          id: randomUUID(),
          serviceInvoiceId: row.invoiceId,
          taxRateId: row.taxRateId,
          name: row.name,
          code: null,
          rate: row.rate,
          type: null,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }
  },

  async down({ context: queryInterface }) {
    await queryInterface.bulkDelete('customer_invoice_taxes', {});
    await queryInterface.bulkDelete('service_invoice_taxes', {});
  },
};

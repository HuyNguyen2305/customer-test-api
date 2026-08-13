import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { listInvoicesSchema, getInvoiceByIdSchema, getInvoicePdfSchema } from '#schemas/customer-invoice.schema.js';

export default async function customerInvoiceRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_INVOICE_CONTROLLER);

  fastify.get('/customer/invoices', { schema: listInvoicesSchema }, (request, reply) =>
    controller.listInvoices(request, reply),
  );

  fastify.get('/customer/invoices/:id', { schema: getInvoiceByIdSchema }, (request, reply) =>
    controller.getInvoiceById(request, reply),
  );

  fastify.get('/customer/invoices/:id/pdf', { schema: getInvoicePdfSchema }, (request, reply) =>
    controller.getInvoicePdf(request, reply),
  );
}

import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { listInvoicesSchema, getInvoiceByIdSchema } from '#schemas/invoice.schema.js';

export default async function invoiceRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.INVOICE_CONTROLLER);

  fastify.get('/invoices', { schema: listInvoicesSchema }, (request, reply) => controller.listInvoices(request, reply));

  fastify.get('/invoices/:id', { schema: getInvoiceByIdSchema }, (request, reply) =>
    controller.getInvoiceById(request, reply),
  );
}

import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { listInvoicesSchema, getInvoiceByIdSchema, getInvoicePdfSchema } from '#schemas/customer-invoice.schema.js';
import {
  listLineItemsSchema,
  addLineItemSchema,
  updateLineItemSchema,
  removeLineItemSchema,
} from '#schemas/customer-invoice-item.schema.js';

export default async function customerInvoiceRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_INVOICE_CONTROLLER);
  const itemController = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_INVOICE_ITEM_CONTROLLER);

  fastify.get('/customer/invoices', { schema: listInvoicesSchema }, (request, reply) =>
    controller.listInvoices(request, reply),
  );

  fastify.get('/customer/invoices/:id', { schema: getInvoiceByIdSchema }, (request, reply) =>
    controller.getInvoiceById(request, reply),
  );

  fastify.get('/customer/invoices/:id/pdf', { schema: getInvoicePdfSchema }, (request, reply) =>
    controller.getInvoicePdf(request, reply),
  );

  fastify.get('/customer/invoices/:invoiceId/items', { schema: listLineItemsSchema }, (request, reply) =>
    itemController.listItems(request, reply),
  );

  fastify.post('/customer/invoices/:invoiceId/items', { schema: addLineItemSchema }, (request, reply) =>
    itemController.addItem(request, reply),
  );

  fastify.patch('/customer/invoices/:invoiceId/items/:itemId', { schema: updateLineItemSchema }, (request, reply) =>
    itemController.updateItem(request, reply),
  );

  fastify.delete('/customer/invoices/:invoiceId/items/:itemId', { schema: removeLineItemSchema }, (request, reply) =>
    itemController.removeItem(request, reply),
  );
}

import { CONTROLLER_KEYS } from '#constants/singleton.js';
import {
  listLineItemsSchema,
  addLineItemSchema,
  updateLineItemSchema,
  removeLineItemSchema,
} from '#schemas/customer-invoice-item.schema.js';

export default async function customerInvoiceItemRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_INVOICE_ITEM_CONTROLLER);

  fastify.get('/customer/invoices/:invoiceId/items', { schema: listLineItemsSchema }, (request, reply) =>
    controller.listItems(request, reply),
  );

  fastify.post('/customer/invoices/:invoiceId/items', { schema: addLineItemSchema }, (request, reply) =>
    controller.addItem(request, reply),
  );

  fastify.patch(
    '/customer/invoices/:invoiceId/items/:itemId',
    { schema: updateLineItemSchema },
    (request, reply) => controller.updateItem(request, reply),
  );

  fastify.delete(
    '/customer/invoices/:invoiceId/items/:itemId',
    { schema: removeLineItemSchema },
    (request, reply) => controller.removeItem(request, reply),
  );
}

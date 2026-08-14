import { requireCustomerId } from '#common/require-customer-id.js';

class CustomerInvoiceItemController {
  constructor({ customerInvoiceItemService }) {
    this.customerInvoiceItemService = customerInvoiceItemService;
  }

  async listItems(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerInvoiceItemService.listItems(customerId, request.params.invoiceId);
    reply.send({ success: true, message: 'Line items retrieved', data });
  }

  async addItem(request, reply) {
    const customerId = requireCustomerId();
    const { itemId, description, qty, sortOrder } = request.body;
    const data = await this.customerInvoiceItemService.addItem(customerId, request.params.invoiceId, {
      itemId,
      description,
      qty,
      sortOrder,
    });
    reply.send({ success: true, message: 'Line item added', data });
  }

  async updateItem(request, reply) {
    const customerId = requireCustomerId();
    // Explicit whitelist, not the raw request.body: this app has no
    // additionalProperties:false/removeAdditional AJV config, so forwarding
    // the whole body would let a client smuggle a cost field straight
    // through to the repository despite the schema not declaring it.
    const { description, qty, sortOrder } = request.body;
    const data = await this.customerInvoiceItemService.updateItem(
      customerId,
      request.params.invoiceId,
      request.params.itemId,
      { description, qty, sortOrder },
    );
    reply.send({ success: true, message: 'Line item updated', data });
  }

  async removeItem(request, reply) {
    const customerId = requireCustomerId();
    await this.customerInvoiceItemService.removeItem(customerId, request.params.invoiceId, request.params.itemId);
    reply.send({ success: true, message: 'Line item removed', data: null });
  }
}

export default CustomerInvoiceItemController;

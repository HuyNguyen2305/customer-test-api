import { ConflictError, NotFoundError } from '#configs/error.js';

class CustomerInvoiceItemService {
  constructor({ customerInvoiceItemRepository, customerInvoiceRepository, itemRepository }) {
    this.customerInvoiceItemRepository = customerInvoiceItemRepository;
    this.customerInvoiceRepository = customerInvoiceRepository;
    this.itemRepository = itemRepository;
  }

  async requireOwnedDraftInvoice(customerId, invoiceId) {
    const invoice = await this.customerInvoiceRepository.findByIdForCustomer(invoiceId, customerId);
    if (!invoice) throw new NotFoundError('Invoice not found');
    return invoice;
  }

  async requireEditableInvoice(customerId, invoiceId) {
    const invoice = await this.requireOwnedDraftInvoice(customerId, invoiceId);
    if (invoice.status !== 'draft') {
      throw new ConflictError('Only draft invoices can have their line items changed');
    }
    return invoice;
  }

  async listItems(customerId, invoiceId) {
    await this.requireOwnedDraftInvoice(customerId, invoiceId);
    return this.customerInvoiceItemRepository.listByInvoiceId(invoiceId);
  }

  // cost is never accepted from the caller - a customer chooses which item and
  // how many, never what it costs. It's always derived from the Item catalog's
  // own price, so a customer can't set an arbitrary (or negative) price on
  // their own invoice by supplying a cost field.
  async addItem(customerId, invoiceId, { itemId, description, qty, sortOrder }) {
    await this.requireEditableInvoice(customerId, invoiceId);
    const item = await this.itemRepository.findByPk(itemId);
    if (!item) throw new NotFoundError('Item not found');

    return this.customerInvoiceItemRepository.createItem({
      customerInvoiceId: invoiceId,
      itemId,
      description,
      cost: item.defaultCost,
      qty,
      sortOrder,
    });
  }

  // Only description/qty/sortOrder are ever writable here - cost is
  // intentionally excluded from the destructure below even if a caller's raw
  // data object happens to include one.
  async updateItem(customerId, invoiceId, itemId, { description, qty, sortOrder }) {
    await this.requireEditableInvoice(customerId, invoiceId);
    const item = await this.customerInvoiceItemRepository.updateItem(itemId, invoiceId, {
      description,
      qty,
      sortOrder,
    });
    if (!item) throw new NotFoundError('Line item not found');
    return item;
  }

  async removeItem(customerId, invoiceId, itemId) {
    await this.requireEditableInvoice(customerId, invoiceId);
    const deleted = await this.customerInvoiceItemRepository.deleteItem(itemId, invoiceId);
    if (!deleted) throw new NotFoundError('Line item not found');
  }
}

export default CustomerInvoiceItemService;

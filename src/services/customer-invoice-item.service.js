import { ConflictError, NotFoundError } from '#configs/error.js';

class CustomerInvoiceItemService {
  constructor({ customerInvoiceItemRepository, customerInvoiceRepository }) {
    this.customerInvoiceItemRepository = customerInvoiceItemRepository;
    this.customerInvoiceRepository = customerInvoiceRepository;
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

  async addItem(customerId, invoiceId, { itemId, description, cost, qty, sortOrder }) {
    await this.requireEditableInvoice(customerId, invoiceId);
    return this.customerInvoiceItemRepository.createItem({
      customerInvoiceId: invoiceId,
      itemId,
      description,
      cost,
      qty,
      sortOrder,
    });
  }

  async updateItem(customerId, invoiceId, itemId, data) {
    await this.requireEditableInvoice(customerId, invoiceId);
    const item = await this.customerInvoiceItemRepository.updateItem(itemId, invoiceId, data);
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

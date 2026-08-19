import { sequelize } from '#common/sequelize.js';
import { ConflictError, NotFoundError } from '#configs/error.js';
import { recomputeItems, toNumberOrNull, flattenTaxSlots, nestTaxSlotsPatch } from './billing-calculation.util.js';

// Postgres DECIMAL columns come back from Sequelize as strings; these
// endpoints return a raw item row straight to the client (no DTO mapper like
// toInvoiceData in between), so the numeric coercion has to happen here.
function toLineItemData(item) {
  return {
    id: item.id,
    customerInvoiceId: item.customerInvoiceId,
    itemId: item.itemId,
    description: item.description,
    cost: toNumberOrNull(item.cost),
    qty: item.qty,
    sortOrder: item.sortOrder,
    subtotal: toNumberOrNull(item.subtotal),
    tax1RateId: item.taxSlots?.tax1RateId ?? null,
    tax1Name: item.taxSlots?.tax1Name ?? null,
    tax1Rate: toNumberOrNull(item.taxSlots?.tax1Rate),
    tax1Total: toNumberOrNull(item.taxSlots?.tax1Total),
    tax2RateId: item.taxSlots?.tax2RateId ?? null,
    tax2Name: item.taxSlots?.tax2Name ?? null,
    tax2Rate: toNumberOrNull(item.taxSlots?.tax2Rate),
    tax2Total: toNumberOrNull(item.taxSlots?.tax2Total),
    total: toNumberOrNull(item.total),
  };
}

class CustomerInvoiceItemService {
  constructor({ customerInvoiceItemRepository, customerInvoiceRepository, itemRepository }) {
    this.customerInvoiceItemRepository = customerInvoiceItemRepository;
    this.customerInvoiceRepository = customerInvoiceRepository;
    this.itemRepository = itemRepository;
  }

  async requireOwnedDraftInvoice(customerId, invoiceId) {
    const invoice = await this.customerInvoiceRepository.findSummaryByIdForCustomer(invoiceId, customerId);
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
    const items = await this.customerInvoiceItemRepository.listByInvoiceId(invoiceId);
    return items.map(toLineItemData);
  }

  // Every item on the invoice shares one discount ratio (it's derived from
  // their combined subtotal), so any add/update/remove shifts every
  // sibling's taxable base - refetch the current full set inside the same
  // transaction and rewrite each one's subtotal/tax/total columns.
  async recomputeInvoiceItems(invoice, transaction) {
    const items = await this.customerInvoiceItemRepository.listByInvoiceId(invoice.id, { transaction });
    const patches = recomputeItems(items.map(flattenTaxSlots), invoice).map(nestTaxSlotsPatch);
    await this.customerInvoiceItemRepository.updateMany(patches, { transaction });
  }

  // cost is never accepted from the caller - a customer chooses which item and
  // how many, never what it costs. It's always derived from the Item catalog's
  // own price. No tax source exists for a customer-added item either (the Item
  // catalog carries no default tax rate), so tax1/tax2 stay null on it - but
  // the recompute still runs, because this item's subtotal shifts every
  // sibling's discount-adjusted taxable base even though it has no tax of its own.
  async addItem(customerId, invoiceId, { itemId, description, qty, sortOrder }) {
    const invoice = await this.requireEditableInvoice(customerId, invoiceId);
    const item = await this.itemRepository.findByPk(itemId);
    if (!item) throw new NotFoundError('Item not found');

    return sequelize.transaction(async (transaction) => {
      const created = await this.customerInvoiceItemRepository.createItem(
        { customerInvoiceId: invoiceId, itemId, description, cost: item.defaultCost, qty, sortOrder },
        { transaction },
      );
      await this.recomputeInvoiceItems(invoice, transaction);
      const final = await this.customerInvoiceItemRepository.findByPk(created.id, { transaction });
      return toLineItemData(final);
    });
  }

  // Only description/qty/sortOrder are ever writable here - cost and the tax
  // slots are intentionally excluded from the destructure below even if a
  // caller's raw data object happens to include them.
  async updateItem(customerId, invoiceId, itemId, { description, qty, sortOrder }) {
    const invoice = await this.requireEditableInvoice(customerId, invoiceId);

    return sequelize.transaction(async (transaction) => {
      const updated = await this.customerInvoiceItemRepository.updateItem(
        itemId,
        invoiceId,
        { description, qty, sortOrder },
        { transaction },
      );
      if (!updated) throw new NotFoundError('Line item not found');
      await this.recomputeInvoiceItems(invoice, transaction);
      const final = await this.customerInvoiceItemRepository.findByPk(itemId, { transaction });
      return toLineItemData(final);
    });
  }

  async removeItem(customerId, invoiceId, itemId) {
    const invoice = await this.requireEditableInvoice(customerId, invoiceId);

    return sequelize.transaction(async (transaction) => {
      const deleted = await this.customerInvoiceItemRepository.deleteItem(itemId, invoiceId, { transaction });
      if (!deleted) throw new NotFoundError('Line item not found');
      await this.recomputeInvoiceItems(invoice, transaction);
    });
  }
}

export default CustomerInvoiceItemService;

import { NotFoundError } from '#configs/error.js';

// Derived from the current items + frozen tax rows every time an invoice is
// read — nothing here is persisted, so there's no stored total that can drift
// out of sync with the underlying items/taxes.
function computeTotals(invoice) {
  const items = invoice.items ?? [];
  const taxes = invoice.taxes ?? [];

  const subtotal = items.reduce((sum, item) => sum + Number(item.cost) * item.qty, 0);
  const discountAmount =
    invoice.discountType === 'flat' ? Number(invoice.discountValue) : subtotal * (Number(invoice.discountValue) / 100);
  const taxableAmount = subtotal - discountAmount;

  const taxBreakdown = taxes.map((tax) => ({
    id: tax.id,
    name: tax.name,
    code: tax.code,
    rate: tax.rate,
    type: tax.type,
    amount: taxableAmount * (Number(tax.rate) / 100),
  }));
  const taxTotal = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxes: taxBreakdown,
    taxTotal,
    total: taxableAmount + taxTotal,
  };
}

function toInvoiceData(invoice) {
  return {
    id: invoice.id,
    bookingId: invoice.bookingId,
    customerId: invoice.customerId,
    sourceInvoiceId: invoice.sourceInvoiceId,
    discountValue: invoice.discountValue,
    discountType: invoice.discountType,
    termsText: invoice.termsText,
    notesText: invoice.notesText,
    status: invoice.status,
    balanceDue: invoice.balanceDue,
    addressId: invoice.addressId,
    addressLabel: invoice.addressLabel,
    addressLine1: invoice.addressLine1,
    addressLine2: invoice.addressLine2,
    addressCity: invoice.addressCity,
    addressState: invoice.addressState,
    addressZip: invoice.addressZip,
    addressCountry: invoice.addressCountry,
    ...computeTotals(invoice),
    ...(invoice.items && {
      items: invoice.items.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        description: item.description,
        cost: item.cost,
        qty: item.qty,
        sortOrder: item.sortOrder,
      })),
    }),
  };
}

class CustomerInvoiceService {
  constructor({ customerInvoiceRepository }) {
    this.customerInvoiceRepository = customerInvoiceRepository;
  }

  async listInvoices(customerId, { page = 1, pageSize = 20, addressId, status, statusOrder } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.customerInvoiceRepository.listByCustomerId(customerId, {
      limit: pageSize,
      offset,
      addressId,
      status,
      statusOrder,
    });
    return {
      invoices: rows.map(toInvoiceData),
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async getInvoiceById(id, customerId) {
    const invoice = await this.customerInvoiceRepository.findByIdForCustomer(id, customerId);
    if (!invoice) throw new NotFoundError('Invoice not found');
    return toInvoiceData(invoice);
  }
}

export default CustomerInvoiceService;

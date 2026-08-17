import { NotFoundError } from '#configs/error.js';
import { computeEntityTotals, toNumberOrNull } from './billing-calculation.util.js';

// Only 'sent' has a portal-facing label today: that's the status the client
// portal's "Pay My Balance" screen groups under "Open" once an admin sends
// the invoice. Other statuses aren't part of this feature's criteria.
const STATUS_LABELS = { sent: 'Open' };

export function toInvoiceData(invoice) {
  return {
    id: invoice.id,
    bookingId: invoice.bookingId,
    customerId: invoice.customerId,
    sourceInvoiceId: invoice.sourceInvoiceId,
    createdAt: invoice.createdAt,
    discountValue: invoice.discountValue,
    discountType: invoice.discountType,
    termsText: invoice.termsText,
    notesText: invoice.notesText,
    status: invoice.status,
    statusLabel: STATUS_LABELS[invoice.status] ?? null,
    balanceDue: invoice.balanceDue,
    addressId: invoice.addressId,
    addressLabel: invoice.addressLabel,
    addressLine1: invoice.addressLine1,
    addressLine2: invoice.addressLine2,
    addressCity: invoice.addressCity,
    addressState: invoice.addressState,
    addressZip: invoice.addressZip,
    addressCountry: invoice.addressCountry,
    ...computeEntityTotals(invoice),
    ...(invoice.items && {
      items: invoice.items.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        description: item.description,
        cost: item.cost,
        qty: item.qty,
        sortOrder: item.sortOrder,
        subtotal: toNumberOrNull(item.subtotal),
        tax1RateId: item.tax1RateId,
        tax1Name: item.tax1Name,
        tax1Rate: toNumberOrNull(item.tax1Rate),
        tax1Total: toNumberOrNull(item.tax1Total),
        tax2RateId: item.tax2RateId,
        tax2Name: item.tax2Name,
        tax2Rate: toNumberOrNull(item.tax2Rate),
        tax2Total: toNumberOrNull(item.tax2Total),
        total: toNumberOrNull(item.total),
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

import { NotFoundError } from '#configs/error.js';
import { computeEntityTotals, toNumberOrNull, flattenTaxSlots } from './billing-calculation.util.js';

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
    addressLabel: invoice.addressSnapshot?.addressLabel ?? null,
    addressLine1: invoice.addressSnapshot?.addressLine1 ?? null,
    addressLine2: invoice.addressSnapshot?.addressLine2 ?? null,
    addressCity: invoice.addressSnapshot?.addressCity ?? null,
    addressState: invoice.addressSnapshot?.addressState ?? null,
    addressZip: invoice.addressSnapshot?.addressZip ?? null,
    addressCountry: invoice.addressSnapshot?.addressCountry ?? null,
    ...computeEntityTotals({
      items: invoice.items?.map(flattenTaxSlots),
      discountType: invoice.discountType,
      discountValue: invoice.discountValue,
    }),
    ...(invoice.items && {
      items: invoice.items.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        description: item.description,
        cost: item.cost,
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

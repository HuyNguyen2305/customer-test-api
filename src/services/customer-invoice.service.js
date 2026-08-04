import { NotFoundError } from '#configs/error.js';

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
    ...(invoice.items && {
      items: invoice.items.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        description: item.description,
        cost: item.cost,
        taxRateId: item.taxRateId,
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

  async listInvoices(customerId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.customerInvoiceRepository.listByCustomerId(customerId, {
      limit: pageSize,
      offset,
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

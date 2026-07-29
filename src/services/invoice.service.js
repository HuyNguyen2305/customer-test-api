import { NotFoundError } from '#configs/error.js';

class InvoiceService {
  constructor({ invoiceRepository }) {
    this.invoiceRepository = invoiceRepository;
  }

  async listInvoices(customerId, { page = 1, pageSize = 20, status } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.invoiceRepository.listInvoices(customerId, {
      status,
      limit: pageSize,
      offset,
    });
    return {
      invoices: rows,
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async getInvoiceById(id, customerId) {
    const invoice = await this.invoiceRepository.getInvoiceById(id, customerId);
    if (!invoice) throw new NotFoundError('Invoice not found');
    return invoice;
  }
}

export default InvoiceService;

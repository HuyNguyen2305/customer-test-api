import { NotFoundError } from '#configs/error.js';

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
      invoices: rows,
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async getInvoiceById(id, customerId) {
    const invoice = await this.customerInvoiceRepository.findByIdForCustomer(id, customerId);
    if (!invoice) throw new NotFoundError('Invoice not found');
    return invoice;
  }
}

export default CustomerInvoiceService;

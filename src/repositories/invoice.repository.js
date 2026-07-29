import { BaseRepository } from '#common/base-repository.js';

class InvoiceRepository extends BaseRepository {
  constructor({ invoiceModel }) {
    super(invoiceModel);
  }

  listInvoices(customerId, { status, limit, offset } = {}) {
    const where = { customerId, ...(status ? { status } : {}) };
    return this.findAndCountAll({ where, limit, offset, order: [['issueDate', 'DESC']] });
  }

  getInvoiceById(id, customerId) {
    return this.findOne({ where: { id, customerId } });
  }
}

export default InvoiceRepository;

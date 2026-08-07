import { BaseRepository } from '#common/base-repository.js';

class InvoiceItemRepository extends BaseRepository {
  constructor({ invoiceItemModel }) {
    super(invoiceItemModel);
  }

  listByServiceInvoiceId(serviceInvoiceId) {
    return this.findAll({ where: { serviceInvoiceId }, order: [['sortOrder', 'ASC']] });
  }
}

export default InvoiceItemRepository;

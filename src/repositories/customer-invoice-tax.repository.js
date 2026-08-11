import { BaseRepository } from '#common/base-repository.js';

class CustomerInvoiceTaxRepository extends BaseRepository {
  constructor({ customerInvoiceTaxModel }) {
    super(customerInvoiceTaxModel);
  }

  listByInvoiceId(customerInvoiceId) {
    return this.findAll({ where: { customerInvoiceId } });
  }

  createTax(data, options) {
    return this.create(data, options);
  }
}

export default CustomerInvoiceTaxRepository;

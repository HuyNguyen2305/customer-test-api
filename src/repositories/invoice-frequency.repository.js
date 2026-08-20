import { Op } from 'sequelize';

import { BaseRepository } from '#common/base-repository.js';

class InvoiceFrequencyRepository extends BaseRepository {
  constructor({ invoiceFrequencyModel, serviceInvoiceModel }) {
    super(invoiceFrequencyModel);
    this.serviceInvoiceModel = serviceInvoiceModel;
  }

  findByServiceInvoiceId(serviceInvoiceId) {
    return this.findOne({ where: { serviceInvoiceId } });
  }

  findAllActiveRecurring() {
    return this.findAll({
      where: { 'recurrenceRule.repeatType': { [Op.ne]: 'does_not_repeat' } },
      include: [{ model: this.scopeModel(this.serviceInvoiceModel) }],
    });
  }
}

export default InvoiceFrequencyRepository;

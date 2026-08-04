import { BaseRepository } from '#common/base-repository.js';

class CustomerInvoiceRepository extends BaseRepository {
  constructor({ customerInvoiceModel, customerInvoiceItemModel }) {
    super(customerInvoiceModel);
    this.customerInvoiceItemModel = customerInvoiceItemModel;
  }

  findByBookingId(bookingId) {
    return this.findOne({ where: { bookingId } });
  }

  createInvoice(data) {
    return this.create(data);
  }

  findBySourceInvoiceId(sourceInvoiceId) {
    return this.findAll({ where: { sourceInvoiceId }, order: [['createdAt', 'DESC']] });
  }

  listByCustomerId(customerId, { limit, offset } = {}) {
    return this.findAndCountAll({
      where: { customerId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });
  }

  findByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: this.scopeModel(this.customerInvoiceItemModel), as: 'items' }],
    });
  }
}

export default CustomerInvoiceRepository;

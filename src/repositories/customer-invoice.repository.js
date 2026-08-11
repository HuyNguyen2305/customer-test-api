import { sequelize } from '#common/sequelize.js';
import { BaseRepository } from '#common/base-repository.js';

const STATUS_ORDER = ['draft', 'sent', 'void', 'write_off', 'paid'];

class CustomerInvoiceRepository extends BaseRepository {
  constructor({ customerInvoiceModel, customerInvoiceItemModel, addressModel, customerInvoiceTaxModel }) {
    super(customerInvoiceModel);
    this.customerInvoiceItemModel = customerInvoiceItemModel;
    this.addressModel = addressModel;
    this.customerInvoiceTaxModel = customerInvoiceTaxModel;
  }

  findByBookingId(bookingId) {
    return this.findOne({ where: { bookingId } });
  }

  createInvoice(data, options) {
    return this.create(data, options);
  }

  findBySourceInvoiceId(sourceInvoiceId) {
    return this.findAll({ where: { sourceInvoiceId }, order: [['createdAt', 'DESC']] });
  }

  listByCustomerId(customerId, { limit, offset, addressId, status, statusOrder } = {}) {
    const order = [];
    if (statusOrder === 'asc' || statusOrder === 'desc') {
      const statusCase = STATUS_ORDER.map((value, index) => `WHEN '${value}' THEN ${index}`).join(' ');
      order.push([sequelize.literal(`CASE status ${statusCase} END`), statusOrder.toUpperCase()]);
    }
    order.push(['createdAt', 'DESC']);

    return this.findAndCountAll({
      where: { customerId, ...(addressId && { addressId }), ...(status && { status }) },
      limit,
      offset,
      order,
      // Only excludes updatedAt, not createdAt: with a hasMany include + limit,
      // Sequelize wraps this in a subquery, and an ORDER BY that references a
      // column missing from the subquery's SELECT fails outright. toInvoiceData
      // already whitelists response fields, so createdAt never reaches the API
      // even though it stays in the query.
      attributes: { exclude: ['updatedAt'] },
      include: [
        { model: this.scopeModel(this.customerInvoiceItemModel), as: 'items' },
        { model: this.scopeModel(this.addressModel), as: 'address' },
        { model: this.scopeModel(this.customerInvoiceTaxModel), as: 'taxes' },
      ],
    });
  }

  findByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [
        { model: this.scopeModel(this.customerInvoiceItemModel), as: 'items' },
        { model: this.scopeModel(this.addressModel), as: 'address' },
        { model: this.scopeModel(this.customerInvoiceTaxModel), as: 'taxes' },
      ],
    });
  }
}

export default CustomerInvoiceRepository;

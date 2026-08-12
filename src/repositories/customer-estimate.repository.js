import { BaseRepository } from '#common/base-repository.js';

class CustomerEstimateRepository extends BaseRepository {
  constructor({ customerEstimateModel, customerEstimateItemModel, bookingModel }) {
    super(customerEstimateModel);
    this.customerEstimateItemModel = customerEstimateItemModel;
    this.bookingModel = bookingModel;
  }

  listByCustomerId(customerId, { limit, offset, addressId, statuses } = {}) {
    return this.findAndCountAll({
      where: { customerId, ...(statuses && { status: statuses }) },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: addressId
        ? [{ model: this.scopeModel(this.bookingModel), attributes: [], where: { addressId }, required: true }]
        : [],
    });
  }

  updateStatus(id, customerId, status, options = {}) {
    return this.update({ status }, { where: { id, customerId }, ...options });
  }

  findByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: this.scopeModel(this.customerEstimateItemModel), as: 'items' }],
    });
  }
}

export default CustomerEstimateRepository;

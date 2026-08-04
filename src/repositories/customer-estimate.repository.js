import { BaseRepository } from '#common/base-repository.js';

class CustomerEstimateRepository extends BaseRepository {
  constructor({ customerEstimateModel, customerEstimateItemModel }) {
    super(customerEstimateModel);
    this.customerEstimateItemModel = customerEstimateItemModel;
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
      include: [{ model: this.scopeModel(this.customerEstimateItemModel), as: 'items' }],
    });
  }
}

export default CustomerEstimateRepository;

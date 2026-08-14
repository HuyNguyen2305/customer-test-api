import { BaseRepository } from '#common/base-repository.js';

class CustomerEstimateRepository extends BaseRepository {
  constructor({
    customerEstimateModel,
    customerEstimateItemModel,
    bookingModel,
    addressModel,
    customerModel,
    taxRateModel,
    itemModel,
  }) {
    super(customerEstimateModel);
    this.customerEstimateItemModel = customerEstimateItemModel;
    this.bookingModel = bookingModel;
    this.addressModel = addressModel;
    this.customerModel = customerModel;
    this.taxRateModel = taxRateModel;
    this.itemModel = itemModel;
  }

  listByCustomerId(customerId, { limit, offset, addressId, statuses } = {}) {
    return this.findAndCountAll({
      where: { customerId, ...(statuses && { status: statuses }) },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      // Only excludes updatedAt, not createdAt: with a hasMany include + limit,
      // Sequelize wraps this in a subquery, and an ORDER BY that references a
      // column missing from the subquery's SELECT fails outright. toEstimateData
      // already whitelists response fields, so createdAt never reaches the API
      // even though it stays in the query (same fix as the invoice repository).
      attributes: { exclude: ['updatedAt'] },
      include: [
        {
          model: this.scopeModel(this.customerEstimateItemModel),
          as: 'items',
          include: [{ model: this.scopeModel(this.taxRateModel) }],
        },
        ...(addressId
          ? [{ model: this.scopeModel(this.bookingModel), attributes: [], where: { addressId }, required: true }]
          : []),
      ],
    });
  }

  updateStatus(id, customerId, status, options = {}) {
    return this.update({ status }, { where: { id, customerId }, ...options });
  }

  findByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: { exclude: ['updatedAt'] },
      include: [
        {
          model: this.scopeModel(this.customerEstimateItemModel),
          as: 'items',
          include: [{ model: this.scopeModel(this.taxRateModel) }, { model: this.scopeModel(this.itemModel) }],
        },
        {
          model: this.scopeModel(this.bookingModel),
          include: [{ model: this.scopeModel(this.addressModel) }],
        },
        { model: this.scopeModel(this.customerModel), as: 'Customer' },
      ],
    });
  }
}

export default CustomerEstimateRepository;

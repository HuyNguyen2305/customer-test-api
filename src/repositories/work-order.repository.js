import { BaseRepository } from '#common/base-repository.js';

class WorkOrderRepository extends BaseRepository {
  constructor({ bookingModel, serviceModel, addressModel }) {
    super(bookingModel);
    this.serviceModel = serviceModel;
    this.addressModel = addressModel;
  }

  listCompletedByCustomerId(customerId, { addressId, limit, offset } = {}) {
    return this.findAndCountAll({
      where: { customerId, status: 'completed', ...(addressId && { addressId }) },
      limit,
      offset,
      order: [['startTime', 'DESC']],
      include: [{ model: this.scopeModel(this.serviceModel) }, { model: this.scopeModel(this.addressModel) }],
    });
  }

  findCompletedByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId, status: 'completed' },
      include: [{ model: this.scopeModel(this.serviceModel) }, { model: this.scopeModel(this.addressModel) }],
    });
  }
}

export default WorkOrderRepository;

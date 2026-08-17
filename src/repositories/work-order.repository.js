import { BaseRepository } from '#common/base-repository.js';

class WorkOrderRepository extends BaseRepository {
  constructor({ bookingModel, serviceModel, addressModel }) {
    super(bookingModel);
    this.serviceModel = serviceModel;
    this.addressModel = addressModel;
  }

  // toWorkOrderData only reads Service.name and a fixed set of Address columns.
  listCompletedByCustomerId(customerId, { addressId, limit, offset } = {}) {
    return this.findAndCountAll({
      where: { customerId, status: 'completed', ...(addressId && { addressId }) },
      limit,
      offset,
      order: [['startTime', 'DESC']],
      include: [
        { model: this.scopeModel(this.serviceModel), attributes: ['name'] },
        {
          model: this.scopeModel(this.addressModel),
          attributes: ['id', 'label', 'line1', 'line2', 'city', 'state', 'zip', 'country'],
        },
      ],
    });
  }

  findCompletedByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId, status: 'completed' },
      include: [
        { model: this.scopeModel(this.serviceModel), attributes: ['name'] },
        {
          model: this.scopeModel(this.addressModel),
          attributes: ['id', 'label', 'line1', 'line2', 'city', 'state', 'zip', 'country'],
        },
      ],
    });
  }
}

export default WorkOrderRepository;

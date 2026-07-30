import { Op } from 'sequelize';

import { BaseRepository } from '#common/base-repository.js';

class BookingRepository extends BaseRepository {
  constructor({ bookingModel }) {
    super(bookingModel);
  }

  createBooking(data) {
    return this.create(data);
  }

  findExistingOccurrence({ serviceId, customerId, startTime }) {
    return this.findOne({ where: { serviceId, customerId, startTime } });
  }

  findLatestByServiceAndCustomer(serviceId, customerId) {
    return this.findOne({
      where: { serviceId, customerId },
      order: [['startTime', 'DESC']],
    });
  }

  findDistinctCustomersByService(serviceId) {
    return this.findAll({
      where: { serviceId },
      attributes: ['customerId'],
      group: ['customerId'],
    });
  }

  findActiveBookings() {
    return this.findAll({ where: { status: { [Op.in]: ['pending', 'confirmed'] } } });
  }

  findCreatedSinceByService(serviceId, since) {
    return this.findAll({ where: { serviceId, createdAt: { [Op.gt]: since } } });
  }

  findFutureCancellableByService(serviceId, now) {
    return this.findAll({
      where: {
        serviceId,
        startTime: { [Op.gt]: now },
        status: { [Op.notIn]: ['completed', 'cancelled'] },
      },
    });
  }

  cancelBookings(ids) {
    return this.update({ status: 'cancelled' }, { where: { id: { [Op.in]: ids } } });
  }
}

export default BookingRepository;

import { BaseRepository } from '#common/base-repository.js';

class MaterialRepository extends BaseRepository {
  constructor({ materialModel }) {
    super(materialModel);
  }

  findByServiceId(serviceId) {
    return this.findAll({ where: { serviceId }, order: [['sortOrder', 'ASC']] });
  }

  findByBookingId(bookingId) {
    return this.findAll({ where: { bookingId } });
  }

  updateOne(id, data) {
    return this.update({ ...data, isCustomized: true }, { where: { id } });
  }

  deleteByBookingId(bookingId) {
    return this.destroy({ where: { bookingId } });
  }
}

export default MaterialRepository;

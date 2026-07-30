import { BaseRepository } from '#common/base-repository.js';

class JobMaterialRepository extends BaseRepository {
  constructor({ jobMaterialModel }) {
    super(jobMaterialModel);
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

export default JobMaterialRepository;

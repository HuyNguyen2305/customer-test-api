import { BaseRepository } from '#common/base-repository.js';

class ServiceRecurrenceRepository extends BaseRepository {
  constructor({ serviceRecurrenceModel }) {
    super(serviceRecurrenceModel);
  }

  findByServiceId(serviceId) {
    return this.findOne({ where: { serviceId } });
  }
}

export default ServiceRecurrenceRepository;

import { BaseRepository } from '#common/base-repository.js';

class ServiceRepository extends BaseRepository {
  constructor({ serviceModel, serviceRecurrenceModel }) {
    super(serviceModel);
    this.serviceRecurrenceModel = serviceRecurrenceModel;
  }

  findActiveServicesWithRecurrence() {
    return this.findAll({
      where: { status: 'active' },
      include: [{ model: this.serviceRecurrenceModel }],
    });
  }

  findById(id) {
    return this.findByPk(id);
  }

  updateStatus(id, status) {
    return this.update({ status }, { where: { id } });
  }
}

export default ServiceRepository;

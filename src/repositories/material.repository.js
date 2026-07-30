import { BaseRepository } from '#common/base-repository.js';

class MaterialRepository extends BaseRepository {
  constructor({ materialModel }) {
    super(materialModel);
  }

  findByServiceId(serviceId) {
    return this.findAll({ where: { serviceId }, order: [['sortOrder', 'ASC']] });
  }
}

export default MaterialRepository;

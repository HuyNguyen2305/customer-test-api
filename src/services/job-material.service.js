import { NotFoundError } from '#configs/error.js';

class JobMaterialService {
  constructor({ materialRepository }) {
    this.materialRepository = materialRepository;
  }

  async updateJobMaterial(id, data) {
    const [affectedCount] = await this.materialRepository.updateOne(id, data);
    if (!affectedCount) throw new NotFoundError('Job material not found');
    return this.materialRepository.findByPk(id);
  }
}

export default JobMaterialService;

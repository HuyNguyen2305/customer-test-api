import { NotFoundError } from '#configs/error.js';

class JobMaterialService {
  constructor({ jobMaterialRepository }) {
    this.jobMaterialRepository = jobMaterialRepository;
  }

  async updateJobMaterial(id, data) {
    const [affectedCount] = await this.jobMaterialRepository.updateOne(id, data);
    if (!affectedCount) throw new NotFoundError('Job material not found');
    return this.jobMaterialRepository.findByPk(id);
  }
}

export default JobMaterialService;

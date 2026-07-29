import { BaseRepository } from '#common/base-repository.js';

class EstimateRepository extends BaseRepository {
  constructor({ estimateModel }) {
    super(estimateModel);
  }

  listEstimates(customerId, { status, limit, offset } = {}) {
    return this.findAndCountAll({
      where: { customerId, ...(status ? { status } : {}) },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  }

  getEstimateById(id, customerId) {
    return this.findOne({ where: { id, customerId } });
  }

  createEstimate(data) {
    return this.create(data);
  }
}

export default EstimateRepository;

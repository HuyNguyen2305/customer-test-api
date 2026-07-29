import { NotFoundError } from '#configs/error.js';

class EstimateService {
  constructor({ estimateRepository }) {
    this.estimateRepository = estimateRepository;
  }

  async listEstimates(customerId, { page = 1, pageSize = 20, status } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.estimateRepository.listEstimates(customerId, {
      status,
      limit: pageSize,
      offset,
    });
    return {
      estimates: rows,
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async getEstimateById(id, customerId) {
    const estimate = await this.estimateRepository.getEstimateById(id, customerId);
    if (!estimate) throw new NotFoundError('Estimate not found');
    return estimate;
  }

  createEstimate(customerId, { amount, description, validUntil, status } = {}) {
    return this.estimateRepository.createEstimate({
      customerId,
      amount,
      description,
      validUntil,
      ...(status ? { status } : {}),
    });
  }
}

export default EstimateService;

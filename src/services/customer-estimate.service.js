import { NotFoundError } from '#configs/error.js';

class CustomerEstimateService {
  constructor({ customerEstimateRepository }) {
    this.customerEstimateRepository = customerEstimateRepository;
  }

  async listEstimates(customerId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.customerEstimateRepository.listByCustomerId(customerId, {
      limit: pageSize,
      offset,
    });
    return {
      estimates: rows,
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async getEstimateById(id, customerId) {
    const estimate = await this.customerEstimateRepository.findByIdForCustomer(id, customerId);
    if (!estimate) throw new NotFoundError('Estimate not found');
    return estimate;
  }
}

export default CustomerEstimateService;

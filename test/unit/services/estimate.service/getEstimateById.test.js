import { jest } from '@jest/globals';

const { default: EstimateService } = await import('#service/estimate.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('EstimateService.getEstimateById', () => {
  it('returns the estimate from the repository', async () => {
    const estimate = { id: 'e1', customerId: 'c1', amount: 42 };
    const service = Object.create(EstimateService.prototype);
    service.estimateRepository = { getEstimateById: jest.fn().mockResolvedValue(estimate) };

    const result = await service.getEstimateById('e1', 'c1');

    expect(service.estimateRepository.getEstimateById).toHaveBeenCalledWith('e1', 'c1');
    expect(result).toBe(estimate);
  });

  it('throws NotFoundError when no estimate exists', async () => {
    const service = Object.create(EstimateService.prototype);
    service.estimateRepository = { getEstimateById: jest.fn().mockResolvedValue(null) };

    await expect(service.getEstimateById('missing', 'c1')).rejects.toThrow(NotFoundError);
  });
});

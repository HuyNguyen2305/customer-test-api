import { jest } from '@jest/globals';

const { default: CustomerEstimateService } = await import('#service/customer-estimate.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerEstimateService.getEstimateById', () => {
  it('returns the estimate scoped to the customer', async () => {
    const estimate = { id: 'e1', customerId: 'c1' };
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(estimate) };

    const result = await service.getEstimateById('e1', 'c1');

    expect(service.customerEstimateRepository.findByIdForCustomer).toHaveBeenCalledWith('e1', 'c1');
    expect(result).toBe(estimate);
  });

  it('throws NotFoundError when the estimate belongs to another customer', async () => {
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(null) };

    await expect(service.getEstimateById('e1', 'someone-else')).rejects.toThrow(NotFoundError);
  });
});

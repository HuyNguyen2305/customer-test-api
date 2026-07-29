import { jest } from '@jest/globals';

const { default: EstimateService } = await import('#service/estimate.service.js');

describe('EstimateService.createEstimate', () => {
  it('creates the estimate with the customerId and given fields', async () => {
    const created = { id: 'e1', customerId: 'c1', amount: 500 };
    const service = Object.create(EstimateService.prototype);
    service.estimateRepository = { createEstimate: jest.fn().mockResolvedValue(created) };

    const result = await service.createEstimate('c1', {
      amount: 500,
      description: 'Kitchen remodel',
      validUntil: '2026-08-31',
    });

    expect(service.estimateRepository.createEstimate).toHaveBeenCalledWith({
      customerId: 'c1',
      amount: 500,
      description: 'Kitchen remodel',
      validUntil: '2026-08-31',
    });
    expect(result).toBe(created);
  });

  it('forwards an explicit status when provided', async () => {
    const service = Object.create(EstimateService.prototype);
    service.estimateRepository = { createEstimate: jest.fn().mockResolvedValue({}) };

    await service.createEstimate('c1', { amount: 100, status: 'sent' });

    expect(service.estimateRepository.createEstimate).toHaveBeenCalledWith({
      customerId: 'c1',
      amount: 100,
      description: undefined,
      validUntil: undefined,
      status: 'sent',
    });
  });
});

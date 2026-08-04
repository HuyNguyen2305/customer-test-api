import { jest } from '@jest/globals';

const { default: CustomerEstimateService } = await import('#service/customer-estimate.service.js');

const estimateRow = {
  id: 'e1',
  bookingId: 'b1',
  customerId: 'c1',
  sourceEstimateId: null,
  type: 'basic',
  discountValue: 5,
  discountType: 'flat',
  depositValue: 20,
  depositType: 'flat',
  termsText: null,
  notesText: null,
  status: 'sent',
};

describe('CustomerEstimateService.listEstimates', () => {
  it('paginates using default page/pageSize and maps rows to the estimate DTO', async () => {
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = {
      listByCustomerId: jest.fn().mockResolvedValue({ rows: [estimateRow], count: 1 }),
    };

    const result = await service.listEstimates('c1');

    expect(service.customerEstimateRepository.listByCustomerId).toHaveBeenCalledWith('c1', { limit: 20, offset: 0 });
    expect(result).toEqual({
      estimates: [estimateRow],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  it('returns an empty list without error when the customer has no estimates', async () => {
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };

    const result = await service.listEstimates('c1');

    expect(result.estimates).toEqual([]);
  });
});

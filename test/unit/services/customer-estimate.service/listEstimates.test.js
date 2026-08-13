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

    expect(service.customerEstimateRepository.listByCustomerId).toHaveBeenCalledWith('c1', {
      limit: 20,
      offset: 0,
      addressId: undefined,
      statuses: ['sent', 'approved'],
    });
    expect(result).toEqual({
      estimates: [
        {
          ...estimateRow,
          statusLabel: 'Open',
          subtotal: 0,
          discountAmount: 5,
          taxableAmount: -5,
          taxTotal: 0,
          total: -5,
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  it('forwards addressId to the repository when provided', async () => {
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = {
      listByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 0 }),
    };

    await service.listEstimates('c1', { addressId: 'addr1' });

    expect(service.customerEstimateRepository.listByCustomerId).toHaveBeenCalledWith('c1', {
      limit: 20,
      offset: 0,
      addressId: 'addr1',
      statuses: ['sent', 'approved'],
    });
  });

  it('maps an approved estimate to the "Accepted" status label', async () => {
    const approvedRow = { ...estimateRow, status: 'approved' };
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = {
      listByCustomerId: jest.fn().mockResolvedValue({ rows: [approvedRow], count: 1 }),
    };

    const result = await service.listEstimates('c1');

    expect(result.estimates[0].statusLabel).toBe('Accepted');
  });

  it('returns an empty list without error when the customer has no estimates', async () => {
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };

    const result = await service.listEstimates('c1');

    expect(result.estimates).toEqual([]);
  });
});

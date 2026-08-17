import { jest } from '@jest/globals';

const FAKE_TRANSACTION = { id: 'fake-transaction' };
const transactionMock = jest.fn((fn) => fn(FAKE_TRANSACTION));

jest.unstable_mockModule('#common/sequelize.js', () => ({
  sequelize: { transaction: transactionMock },
}));

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
  // The repository's listByCustomerId now includes items (fixed alongside
  // the missing-items bug that made list-view totals always show $0) - this
  // mock reflects that real shape instead of omitting items.
  items: [
    {
      id: 'ei1',
      itemId: 'item1',
      description: 'A',
      cost: 100,
      qty: 1,
      sortOrder: 0,
      tax1RateId: null,
      tax2RateId: null,
    },
  ],
};

function buildService() {
  const service = Object.create(CustomerEstimateService.prototype);
  service.customerEstimateItemRepository = { updateMany: jest.fn().mockResolvedValue(undefined) };
  return service;
}

describe('CustomerEstimateService.listEstimates', () => {
  it('paginates using default page/pageSize and maps rows to the estimate DTO', async () => {
    const service = buildService();
    service.customerEstimateRepository = {
      listByCustomerId: jest
        .fn()
        .mockResolvedValue({ rows: [{ ...estimateRow, items: [{ ...estimateRow.items[0] }] }], count: 1 }),
    };

    const result = await service.listEstimates('c1');

    expect(service.customerEstimateRepository.listByCustomerId).toHaveBeenCalledWith('c1', {
      limit: 20,
      offset: 0,
      addressId: undefined,
      statuses: ['sent', 'approved'],
    });
    expect(service.customerEstimateItemRepository.updateMany).toHaveBeenCalled();
    expect(result).toEqual({
      estimates: [
        {
          ...estimateRow,
          items: [
            {
              id: 'ei1',
              itemId: 'item1',
              itemName: null,
              description: 'A',
              cost: 100,
              qty: 1,
              sortOrder: 0,
              subtotal: 100,
              tax1RateId: null,
              tax1Name: null,
              tax1Rate: null,
              tax1Total: null,
              tax2RateId: null,
              tax2Name: null,
              tax2Rate: null,
              tax2Total: null,
              total: 100,
            },
          ],
          statusLabel: 'Open',
          subtotal: 100,
          discountAmount: 5,
          taxableAmount: 95,
          taxes: [],
          taxTotal: 0,
          total: 95,
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  it('forwards addressId to the repository when provided', async () => {
    const service = buildService();
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
    const approvedRow = { ...estimateRow, status: 'approved', items: [{ ...estimateRow.items[0] }] };
    const service = buildService();
    service.customerEstimateRepository = {
      listByCustomerId: jest.fn().mockResolvedValue({ rows: [approvedRow], count: 1 }),
    };

    const result = await service.listEstimates('c1');

    expect(result.estimates[0].statusLabel).toBe('Accepted');
  });

  it('returns an empty list without error when the customer has no estimates', async () => {
    const service = buildService();
    service.customerEstimateRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };

    const result = await service.listEstimates('c1');

    expect(result.estimates).toEqual([]);
  });
});

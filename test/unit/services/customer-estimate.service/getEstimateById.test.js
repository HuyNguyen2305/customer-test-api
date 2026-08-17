import { jest } from '@jest/globals';

const FAKE_TRANSACTION = { id: 'fake-transaction' };
const transactionMock = jest.fn((fn) => fn(FAKE_TRANSACTION));

// refreshItemCache() wraps its item-column write in sequelize.transaction() -
// this test builds the service with plain mocked repos/no real DB, so the
// transaction runner itself must be stubbed to just invoke its callback.
jest.unstable_mockModule('#common/sequelize.js', () => ({
  sequelize: { transaction: transactionMock },
}));

const { default: CustomerEstimateService } = await import('#service/customer-estimate.service.js');
const { NotFoundError } = await import('#configs/error.js');

const baseEstimate = {
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

function buildService() {
  const service = Object.create(CustomerEstimateService.prototype);
  service.customerEstimateItemRepository = { updateMany: jest.fn().mockResolvedValue(undefined) };
  return service;
}

describe('CustomerEstimateService.getEstimateById', () => {
  it('maps the estimate (without items) to the DTO when none are loaded', async () => {
    const service = buildService();
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(baseEstimate) };

    const result = await service.getEstimateById('e1', 'c1');

    expect(service.customerEstimateRepository.findByIdForCustomer).toHaveBeenCalledWith('e1', 'c1');
    expect(service.customerEstimateItemRepository.updateMany).toHaveBeenCalledWith([], {
      transaction: FAKE_TRANSACTION,
    });
    expect(result).toEqual({
      ...baseEstimate,
      statusLabel: 'Open',
      subtotal: 0,
      discountAmount: 5,
      taxableAmount: -5,
      taxes: [],
      taxTotal: 0,
      total: -5,
    });
    expect(result.items).toBeUndefined();
  });

  it('maps items to a clean shape under the `items` key when loaded', async () => {
    const estimateWithItems = {
      ...baseEstimate,
      items: [
        {
          id: 'ei1',
          itemId: 'item1',
          description: 'Quoted treatment',
          cost: 80,
          qty: 1,
          sortOrder: 0,
          tax1RateId: null,
          tax1Rate: null,
          tax2RateId: null,
          tax2Rate: null,
        },
      ],
    };
    const service = buildService();
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(estimateWithItems) };

    const result = await service.getEstimateById('e1', 'c1');

    expect(result.items).toEqual([
      {
        id: 'ei1',
        itemId: 'item1',
        itemName: null,
        description: 'Quoted treatment',
        cost: 80,
        qty: 1,
        sortOrder: 0,
        subtotal: 80,
        tax1RateId: null,
        tax1Name: null,
        tax1Rate: null,
        tax1Total: null,
        tax2RateId: null,
        tax2Name: null,
        tax2Rate: null,
        tax2Total: null,
        total: 80,
      },
    ]);
  });

  it('throws NotFoundError when the estimate belongs to another customer', async () => {
    const service = buildService();
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(null) };

    await expect(service.getEstimateById('e1', 'someone-else')).rejects.toThrow(NotFoundError);
  });

  it.each(['draft', 'declined', 'expired'])('throws NotFoundError when the estimate status is %s', async (status) => {
    const service = buildService();
    service.customerEstimateRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ ...baseEstimate, status }),
    };

    await expect(service.getEstimateById('e1', 'c1')).rejects.toThrow(NotFoundError);
  });

  it('taxes each item on its discounted (taxable) share, not its raw pre-discount cost, and refreshes the cache', async () => {
    const estimateWithDiscountedTax = {
      ...baseEstimate,
      discountValue: 50,
      discountType: 'flat',
      items: [
        {
          id: 'ei1',
          itemId: 'item1',
          description: 'A',
          cost: 200,
          qty: 1,
          sortOrder: 0,
          tax1RateId: 'tax1',
          tax2RateId: null,
          Tax1Rate: { name: 'NY Sales Tax', rate: 8 },
        },
      ],
    };
    const service = buildService();
    service.customerEstimateRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue(estimateWithDiscountedTax),
    };

    const result = await service.getEstimateById('e1', 'c1');

    expect(result.taxableAmount).toBe(150);
    expect(result.taxTotal).toBe(12); // 150 * 8%, not 200 * 8% = 16
    expect(result.total).toBe(162);
    expect(service.customerEstimateItemRepository.updateMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: 'ei1',
          tax1RateId: 'tax1',
          tax1Name: 'NY Sales Tax',
          tax1Rate: 8,
          tax1Total: 12,
        }),
      ],
      { transaction: FAKE_TRANSACTION },
    );
  });
});

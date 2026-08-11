import { jest } from '@jest/globals';

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

describe('CustomerEstimateService.getEstimateById', () => {
  it('maps the estimate (without items) to the DTO when none are loaded', async () => {
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(baseEstimate) };

    const result = await service.getEstimateById('e1', 'c1');

    expect(service.customerEstimateRepository.findByIdForCustomer).toHaveBeenCalledWith('e1', 'c1');
    expect(result).toEqual({ ...baseEstimate, statusLabel: 'Open' });
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
          taxRateId: null,
          qty: 1,
          sortOrder: 0,
        },
      ],
    };
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(estimateWithItems) };

    const result = await service.getEstimateById('e1', 'c1');

    expect(result.items).toEqual([
      { id: 'ei1', itemId: 'item1', description: 'Quoted treatment', cost: 80, taxRateId: null, qty: 1, sortOrder: 0 },
    ]);
  });

  it('throws NotFoundError when the estimate belongs to another customer', async () => {
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(null) };

    await expect(service.getEstimateById('e1', 'someone-else')).rejects.toThrow(NotFoundError);
  });

  it.each(['draft', 'declined', 'expired'])('throws NotFoundError when the estimate status is %s', async (status) => {
    const service = Object.create(CustomerEstimateService.prototype);
    service.customerEstimateRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ ...baseEstimate, status }),
    };

    await expect(service.getEstimateById('e1', 'c1')).rejects.toThrow(NotFoundError);
  });
});

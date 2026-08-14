import { jest } from '@jest/globals';

const { default: CustomerEstimateRepository } = await import('#repositories/customer-estimate.repository.js');
const { requestContext } = await import('#common/request-context.js');

function buildRepository({ withBooking = false } = {}) {
  const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
  const model = { schema: jest.fn().mockReturnValue(scopedModel) };
  const scopedItemModel = {};
  const scopedTaxRateModel = {};
  const repository = Object.create(CustomerEstimateRepository.prototype);
  repository.model = model;
  repository.customerEstimateItemModel = { schema: jest.fn().mockReturnValue(scopedItemModel) };
  repository.taxRateModel = { schema: jest.fn().mockReturnValue(scopedTaxRateModel) };
  if (withBooking) {
    const scopedBookingModel = {};
    repository.bookingModel = { schema: jest.fn().mockReturnValue(scopedBookingModel) };
    return { repository, scopedModel, scopedItemModel, scopedTaxRateModel, scopedBookingModel };
  }
  return { repository, scopedModel, scopedItemModel, scopedTaxRateModel };
}

describe('CustomerEstimateRepository.listByCustomerId', () => {
  it('queries estimates scoped to the customerId with pagination, including items for totals', async () => {
    const { repository, scopedModel, scopedItemModel, scopedTaxRateModel } = buildRepository();

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0 }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith({
      where: { customerId: 'c1' },
      limit: 20,
      offset: 0,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['updatedAt'] },
      include: [{ model: scopedItemModel, as: 'items', include: [{ model: scopedTaxRateModel }] }],
    });
  });

  it('filters by status (as an IN list) when statuses is provided', async () => {
    const { repository, scopedModel } = buildRepository();

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0, statuses: ['sent', 'approved'] }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customerId: 'c1', status: ['sent', 'approved'] } }),
    );
  });

  it('joins Booking and filters by addressId when addressId is provided, alongside the items include', async () => {
    const { repository, scopedModel, scopedItemModel, scopedTaxRateModel, scopedBookingModel } = buildRepository({
      withBooking: true,
    });

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0, addressId: 'addr1' }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          { model: scopedItemModel, as: 'items', include: [{ model: scopedTaxRateModel }] },
          { model: scopedBookingModel, attributes: [], where: { addressId: 'addr1' }, required: true },
        ],
      }),
    );
  });
});

import { jest } from '@jest/globals';

const { default: CustomerEstimateRepository } = await import('#repositories/customer-estimate.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerEstimateRepository.listByCustomerId', () => {
  it('queries estimates scoped to the customerId with pagination', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerEstimateRepository.prototype);
    repository.model = model;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0 }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith({
      where: { customerId: 'c1' },
      limit: 20,
      offset: 0,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [],
    });
  });

  it('filters by status (as an IN list) when statuses is provided', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerEstimateRepository.prototype);
    repository.model = model;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0, statuses: ['sent', 'approved'] }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customerId: 'c1', status: ['sent', 'approved'] } }),
    );
  });

  it('joins Booking and filters by addressId when addressId is provided', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const scopedBookingModel = {};
    const bookingModel = { schema: jest.fn().mockReturnValue(scopedBookingModel) };
    const repository = Object.create(CustomerEstimateRepository.prototype);
    repository.model = model;
    repository.bookingModel = bookingModel;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0, addressId: 'addr1' }),
    );

    expect(bookingModel.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [{ model: scopedBookingModel, attributes: [], where: { addressId: 'addr1' }, required: true }],
      }),
    );
  });
});

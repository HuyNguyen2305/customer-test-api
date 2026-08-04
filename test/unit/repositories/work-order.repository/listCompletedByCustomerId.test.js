import { jest } from '@jest/globals';

const { default: WorkOrderRepository } = await import('#repositories/work-order.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('WorkOrderRepository.listCompletedByCustomerId', () => {
  it('queries completed bookings scoped to the customerId, with pagination and service/address eager-loaded', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [{ id: 'b1' }], count: 1 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const scopedServiceModel = {};
    const scopedAddressModel = {};
    const serviceModel = { schema: jest.fn().mockReturnValue(scopedServiceModel) };
    const addressModel = { schema: jest.fn().mockReturnValue(scopedAddressModel) };
    const repository = Object.create(WorkOrderRepository.prototype);
    repository.model = model;
    repository.serviceModel = serviceModel;
    repository.addressModel = addressModel;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listCompletedByCustomerId('c1', { limit: 20, offset: 0 }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith({
      where: { customerId: 'c1', status: 'completed' },
      limit: 20,
      offset: 0,
      order: [['startTime', 'DESC']],
      include: [{ model: scopedServiceModel }, { model: scopedAddressModel }],
    });
    expect(result).toEqual({ rows: [{ id: 'b1' }], count: 1 });
  });

  it('adds an addressId filter when provided', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const serviceModel = { schema: jest.fn().mockReturnValue({}) };
    const addressModel = { schema: jest.fn().mockReturnValue({}) };
    const repository = Object.create(WorkOrderRepository.prototype);
    repository.model = model;
    repository.serviceModel = serviceModel;
    repository.addressModel = addressModel;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listCompletedByCustomerId('c1', { addressId: 'a1', limit: 20, offset: 0 }),
    );

    const callArgs = scopedModel.findAndCountAll.mock.calls[0][0];
    expect(callArgs.where).toEqual({ customerId: 'c1', status: 'completed', addressId: 'a1' });
  });
});

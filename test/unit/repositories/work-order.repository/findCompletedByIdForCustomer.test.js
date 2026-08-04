import { jest } from '@jest/globals';

const { default: WorkOrderRepository } = await import('#repositories/work-order.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('WorkOrderRepository.findCompletedByIdForCustomer', () => {
  it('scopes the lookup by id, customerId, and completed status, with service/address eager-loaded', async () => {
    const booking = { id: 'b1', customerId: 'c1', status: 'completed' };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(booking) };
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
      repository.findCompletedByIdForCustomer('b1', 'c1'),
    );

    expect(scopedModel.findOne).toHaveBeenCalledWith({
      where: { id: 'b1', customerId: 'c1', status: 'completed' },
      include: [{ model: scopedServiceModel }, { model: scopedAddressModel }],
    });
    expect(result).toBe(booking);
  });

  it("returns null when the booking belongs to a different customer (never leaks another owner's row)", async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue(null) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(WorkOrderRepository.prototype);
    repository.model = model;
    repository.serviceModel = { schema: jest.fn().mockReturnValue({}) };
    repository.addressModel = { schema: jest.fn().mockReturnValue({}) };

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findCompletedByIdForCustomer('b1', 'someone-else'),
    );

    expect(result).toBeNull();
  });
});

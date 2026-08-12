import { jest } from '@jest/globals';

const { default: CustomerEstimateRepository } = await import('#repositories/customer-estimate.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerEstimateRepository.updateStatus', () => {
  it('updates status scoped to both id and customerId', async () => {
    const scopedModel = { update: jest.fn().mockResolvedValue([1]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerEstimateRepository.prototype);
    repository.model = model;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateStatus('e1', 'c1', 'approved'),
    );

    expect(scopedModel.update).toHaveBeenCalledWith({ status: 'approved' }, { where: { id: 'e1', customerId: 'c1' } });
  });

  it('forwards extra options (e.g. a transaction) through to the update call', async () => {
    const scopedModel = { update: jest.fn().mockResolvedValue([1]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerEstimateRepository.prototype);
    repository.model = model;
    const transaction = { id: 'txn1' };

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateStatus('e1', 'c1', 'approved', { transaction }),
    );

    expect(scopedModel.update).toHaveBeenCalledWith(
      { status: 'approved' },
      { where: { id: 'e1', customerId: 'c1' }, transaction },
    );
  });
});

import { jest } from '@jest/globals';

const { default: CustomerEstimateItemRepository } = await import('#repositories/customer-estimate-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerEstimateItemRepository.updateMany', () => {
  it('issues one update per patch, concurrently, scoped by id', async () => {
    const scopedModel = { update: jest.fn().mockResolvedValue([1]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerEstimateItemRepository.prototype);
    repository.model = model;

    const transaction = { fakeTransaction: true };
    const patches = [
      { id: 'i1', subtotal: 10, total: 11 },
      { id: 'i2', subtotal: 20, total: 22 },
    ];

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateMany(patches, { transaction }),
    );

    expect(scopedModel.update).toHaveBeenCalledTimes(2);
    expect(scopedModel.update).toHaveBeenCalledWith({ subtotal: 10, total: 11 }, { where: { id: 'i1' }, transaction });
    expect(scopedModel.update).toHaveBeenCalledWith({ subtotal: 20, total: 22 }, { where: { id: 'i2' }, transaction });
  });

  it('does not serialize the updates - all are issued before any resolves', async () => {
    const resolvers = [];
    const scopedModel = {
      update: jest.fn(() => new Promise((resolve) => resolvers.push(resolve))),
    };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerEstimateItemRepository.prototype);
    repository.model = model;

    const patches = [{ id: 'i1' }, { id: 'i2' }, { id: 'i3' }];
    const pending = requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateMany(patches, {}),
    );

    await Promise.resolve();
    expect(scopedModel.update).toHaveBeenCalledTimes(3);

    resolvers.forEach((resolve) => resolve([1]));
    await pending;
  });
});

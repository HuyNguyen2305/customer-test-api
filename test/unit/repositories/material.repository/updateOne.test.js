import { jest } from '@jest/globals';

const { default: MaterialRepository } = await import('#repositories/material.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('MaterialRepository.updateOne', () => {
  it('forces isCustomized to true on any manual update', async () => {
    const scopedModel = { update: jest.fn().mockResolvedValue([1]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(MaterialRepository.prototype);
    repository.model = model;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateOne('jm1', { unitsValue: 5 }),
    );

    expect(scopedModel.update).toHaveBeenCalledWith({ unitsValue: 5, isCustomized: true }, { where: { id: 'jm1' } });
  });
});

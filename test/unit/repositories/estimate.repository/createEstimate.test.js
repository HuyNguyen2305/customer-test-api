import { jest } from '@jest/globals';

const { default: EstimateRepository } = await import('#repositories/estimate.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('EstimateRepository.createEstimate', () => {
  it('creates the estimate on the schema-scoped model', async () => {
    const created = { id: 'e1', customerId: 'c1', amount: 500 };
    const scopedModel = { create: jest.fn().mockResolvedValue(created) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(EstimateRepository.prototype);
    repository.model = model;
    const data = { customerId: 'c1', amount: 500 };

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.createEstimate(data),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.create).toHaveBeenCalledWith(data, undefined);
    expect(result).toEqual(created);
  });

  it('falls back to the plain model when there is no request identity', async () => {
    const created = { id: 'e1' };
    const model = { create: jest.fn().mockResolvedValue(created), schema: jest.fn() };
    const repository = Object.create(EstimateRepository.prototype);
    repository.model = model;

    const result = await repository.createEstimate({ customerId: 'c1', amount: 100 });

    expect(model.schema).not.toHaveBeenCalled();
    expect(model.create).toHaveBeenCalled();
    expect(result).toEqual(created);
  });
});

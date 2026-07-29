import { jest } from '@jest/globals';

const { default: EstimateRepository } = await import('#repositories/estimate.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('EstimateRepository.getEstimateById', () => {
  it('queries the schema-scoped model with id and customerId when identity has a schema', async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue({ id: 'e1', customerId: 'c1' }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(EstimateRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.getEstimateById('e1', 'c1'),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findOne).toHaveBeenCalledWith({ where: { id: 'e1', customerId: 'c1' } });
    expect(result).toEqual({ id: 'e1', customerId: 'c1' });
  });

  it('falls back to the plain model when there is no request identity', async () => {
    const model = { findOne: jest.fn().mockResolvedValue(null), schema: jest.fn() };
    const repository = Object.create(EstimateRepository.prototype);
    repository.model = model;

    const result = await repository.getEstimateById('missing', 'c1');

    expect(model.schema).not.toHaveBeenCalled();
    expect(model.findOne).toHaveBeenCalledWith({ where: { id: 'missing', customerId: 'c1' } });
    expect(result).toBeNull();
  });
});

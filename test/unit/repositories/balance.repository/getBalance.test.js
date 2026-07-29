import { jest } from '@jest/globals';

const { default: BalanceRepository } = await import('#repositories/balance.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('BalanceRepository.getBalance', () => {
  it('queries the schema-scoped model with the customerId when identity has a schema', async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue({ customerId: 'c1', amount: 10 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(BalanceRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.getBalance('c1'),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findOne).toHaveBeenCalledWith({ where: { customerId: 'c1' } });
    expect(result).toEqual({ customerId: 'c1', amount: 10 });
  });

  it('falls back to the plain model when there is no request identity', async () => {
    const model = { findOne: jest.fn().mockResolvedValue(null), schema: jest.fn() };
    const repository = Object.create(BalanceRepository.prototype);
    repository.model = model;

    const result = await repository.getBalance('missing');

    expect(model.schema).not.toHaveBeenCalled();
    expect(model.findOne).toHaveBeenCalledWith({ where: { customerId: 'missing' } });
    expect(result).toBeNull();
  });
});

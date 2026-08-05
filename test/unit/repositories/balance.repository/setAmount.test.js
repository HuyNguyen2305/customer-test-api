import { jest } from '@jest/globals';

const { default: BalanceRepository } = await import('#repositories/balance.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('BalanceRepository.setAmount', () => {
  it('sets the amount for the given customerId on the schema-scoped model', async () => {
    const scopedModel = { update: jest.fn().mockResolvedValue([1]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(BalanceRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.setAmount('c1', 25),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.update).toHaveBeenCalledWith({ amount: 25 }, { where: { customerId: 'c1' } });
    expect(result).toEqual([1]);
  });
});

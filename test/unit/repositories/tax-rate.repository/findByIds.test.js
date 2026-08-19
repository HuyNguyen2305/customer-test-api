import { jest } from '@jest/globals';

const { default: TaxRateRepository } = await import('#repositories/tax-rate.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('TaxRateRepository.findByIds', () => {
  it('looks up tax rates by a list of ids', async () => {
    const taxRates = [
      { id: 'tr1', name: 'NY Sales Tax', rate: 4 },
      { id: 'tr2', name: 'TX Sales Tax', rate: 6.25 },
    ];
    const scopedModel = { findAll: jest.fn().mockResolvedValue(taxRates) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(TaxRateRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByIds(['tr1', 'tr2']),
    );

    expect(scopedModel.findAll).toHaveBeenCalledWith({ where: { id: ['tr1', 'tr2'] } });
    expect(result).toBe(taxRates);
  });

  it('returns an empty array without querying when given no ids', async () => {
    const scopedModel = { findAll: jest.fn() };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(TaxRateRepository.prototype);
    repository.model = model;

    const result = await repository.findByIds([]);

    expect(scopedModel.findAll).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});

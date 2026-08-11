import { jest } from '@jest/globals';

const { default: TaxRateRepository } = await import('#repositories/tax-rate.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('TaxRateRepository.findByState', () => {
  it('looks up the US tax rate for the given state', async () => {
    const taxRate = { id: 'tr1', state: 'CA', country: 'US', rate: 7.25 };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(taxRate) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(TaxRateRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByState('CA'),
    );

    expect(scopedModel.findOne).toHaveBeenCalledWith({ where: { state: 'CA', country: 'US' } });
    expect(result).toBe(taxRate);
  });

  it('returns null without querying when no state is given', async () => {
    const scopedModel = { findOne: jest.fn() };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(TaxRateRepository.prototype);
    repository.model = model;

    const result = await repository.findByState(null);

    expect(scopedModel.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

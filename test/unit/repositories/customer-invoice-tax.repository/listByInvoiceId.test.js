import { jest } from '@jest/globals';

const { default: CustomerInvoiceTaxRepository } = await import('#repositories/customer-invoice-tax.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceTaxRepository.listByInvoiceId', () => {
  it('queries tax rows scoped to the invoice', async () => {
    const scopedModel = { findAll: jest.fn().mockResolvedValue([{ id: 't1' }]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceTaxRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByInvoiceId('i1'),
    );

    expect(scopedModel.findAll).toHaveBeenCalledWith({ where: { customerInvoiceId: 'i1' } });
    expect(result).toEqual([{ id: 't1' }]);
  });
});

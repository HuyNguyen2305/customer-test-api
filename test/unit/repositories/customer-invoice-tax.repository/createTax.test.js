import { jest } from '@jest/globals';

const { default: CustomerInvoiceTaxRepository } = await import('#repositories/customer-invoice-tax.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceTaxRepository.createTax', () => {
  it('creates a tax row scoped to the tenant schema, forwarding any options', async () => {
    const scopedModel = { create: jest.fn().mockResolvedValue({ id: 't1' }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceTaxRepository.prototype);
    repository.model = model;

    const data = { customerInvoiceId: 'i1', taxRateId: 'tr1', name: 'CA Sales Tax', rate: 8.25 };
    const options = { transaction: 'tx' };
    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.createTax(data, options),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.create).toHaveBeenCalledWith(data, options);
  });
});

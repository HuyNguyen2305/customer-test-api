import { jest } from '@jest/globals';

const { default: CustomerInvoiceRepository } = await import('#repositories/customer-invoice.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceRepository.sumBalanceDueByCustomerId', () => {
  it("sums balanceDue across all of a customer's invoices, scoped to the tenant schema", async () => {
    const scopedModel = { sum: jest.fn().mockResolvedValue(130) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.sumBalanceDueByCustomerId('c1'),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.sum).toHaveBeenCalledWith('balanceDue', { where: { customerId: 'c1' } });
    expect(result).toBe(130);
  });

  it('coerces a null sum (no invoices) to 0', async () => {
    const scopedModel = { sum: jest.fn().mockResolvedValue(null) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.sumBalanceDueByCustomerId('c1'),
    );

    expect(result).toBe(0);
  });
});

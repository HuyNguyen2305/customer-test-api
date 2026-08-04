import { jest } from '@jest/globals';

const { default: CustomerInvoiceRepository } = await import('#repositories/customer-invoice.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceRepository.listByCustomerId', () => {
  it('queries invoices scoped to the customerId with pagination', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [{ id: 'i1' }], count: 1 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0 }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith({
      where: { customerId: 'c1' },
      limit: 20,
      offset: 0,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });
    expect(result).toEqual({ rows: [{ id: 'i1' }], count: 1 });
  });
});

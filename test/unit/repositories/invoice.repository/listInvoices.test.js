import { jest } from '@jest/globals';

const { default: InvoiceRepository } = await import('#repositories/invoice.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('InvoiceRepository.listInvoices', () => {
  it('queries the schema-scoped model with customerId, status, and pagination', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [{ id: 'i1' }], count: 1 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(InvoiceRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listInvoices('c1', { status: 'open', limit: 20, offset: 0 }),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith({
      where: { customerId: 'c1', status: 'open' },
      limit: 20,
      offset: 0,
      order: [['issueDate', 'DESC']],
    });
    expect(result).toEqual({ rows: [{ id: 'i1' }], count: 1 });
  });

  it('omits status from the where clause when not provided', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(InvoiceRepository.prototype);
    repository.model = model;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listInvoices('c1', { limit: 20, offset: 0 }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith({
      where: { customerId: 'c1' },
      limit: 20,
      offset: 0,
      order: [['issueDate', 'DESC']],
    });
  });

  it('falls back to the plain model when there is no request identity', async () => {
    const model = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }), schema: jest.fn() };
    const repository = Object.create(InvoiceRepository.prototype);
    repository.model = model;

    await repository.listInvoices('c1', {});

    expect(model.schema).not.toHaveBeenCalled();
    expect(model.findAndCountAll).toHaveBeenCalled();
  });
});

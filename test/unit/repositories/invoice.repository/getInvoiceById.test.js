import { jest } from '@jest/globals';

const { default: InvoiceRepository } = await import('#repositories/invoice.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('InvoiceRepository.getInvoiceById', () => {
  it('queries the schema-scoped model with id and customerId when identity has a schema', async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue({ id: 'i1', customerId: 'c1' }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(InvoiceRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.getInvoiceById('i1', 'c1'),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findOne).toHaveBeenCalledWith({ where: { id: 'i1', customerId: 'c1' } });
    expect(result).toEqual({ id: 'i1', customerId: 'c1' });
  });

  it('falls back to the plain model when there is no request identity', async () => {
    const model = { findOne: jest.fn().mockResolvedValue(null), schema: jest.fn() };
    const repository = Object.create(InvoiceRepository.prototype);
    repository.model = model;

    const result = await repository.getInvoiceById('missing', 'c1');

    expect(model.schema).not.toHaveBeenCalled();
    expect(model.findOne).toHaveBeenCalledWith({ where: { id: 'missing', customerId: 'c1' } });
    expect(result).toBeNull();
  });
});

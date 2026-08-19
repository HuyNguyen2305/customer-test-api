import { jest } from '@jest/globals';

const { default: CustomerInvoiceRepository } = await import('#repositories/customer-invoice.repository.js');
const { requestContext } = await import('#common/request-context.js');
const { sequelize } = await import('#common/sequelize.js');

describe('CustomerInvoiceRepository.listByCustomerId', () => {
  it('queries invoices scoped to the customerId with pagination', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [{ id: 'i1' }], count: 1 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const scopedItemModel = {};
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;
    repository.customerInvoiceItemModel = { schema: jest.fn().mockReturnValue(scopedItemModel) };

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0 }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith({
      where: { customerId: 'c1' },
      limit: 20,
      offset: 0,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['updatedAt'] },
      // No 'address' join - toInvoiceData reads the addressSnapshot JSONB
      // column already on the row instead.
      include: [{ model: scopedItemModel, as: 'items' }],
    });
    expect(result).toEqual({ rows: [{ id: 'i1' }], count: 1 });
  });

  it('applies the addressId and status filters when given', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;
    repository.customerInvoiceItemModel = { schema: jest.fn().mockReturnValue({}) };

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0, addressId: 'a1', status: 'sent' }),
    );

    const [callArgs] = scopedModel.findAndCountAll.mock.calls[0];
    expect(callArgs.where).toEqual({ customerId: 'c1', addressId: 'a1', status: 'sent' });
  });

  it('orders by the frozen status sequence (ascending) when statusOrder=asc, before createdAt DESC', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;
    repository.customerInvoiceItemModel = { schema: jest.fn().mockReturnValue({}) };

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0, statusOrder: 'asc' }),
    );

    const [callArgs] = scopedModel.findAndCountAll.mock.calls[0];
    const expectedCase =
      "CASE status WHEN 'draft' THEN 0 WHEN 'sent' THEN 1 WHEN 'void' THEN 2 WHEN 'write_off' THEN 3 WHEN 'paid' THEN 4 END";
    expect(callArgs.order).toEqual([
      [sequelize.literal(expectedCase), 'ASC'],
      ['createdAt', 'DESC'],
    ]);
  });

  it('orders descending when statusOrder=desc', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;
    repository.customerInvoiceItemModel = { schema: jest.fn().mockReturnValue({}) };

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0, statusOrder: 'desc' }),
    );

    const [callArgs] = scopedModel.findAndCountAll.mock.calls[0];
    expect(callArgs.order[0][1]).toBe('DESC');
  });

  it('omits the status CASE ordering entirely when statusOrder is not given', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;
    repository.customerInvoiceItemModel = { schema: jest.fn().mockReturnValue({}) };

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0 }),
    );

    const [callArgs] = scopedModel.findAndCountAll.mock.calls[0];
    expect(callArgs.order).toEqual([['createdAt', 'DESC']]);
  });
});

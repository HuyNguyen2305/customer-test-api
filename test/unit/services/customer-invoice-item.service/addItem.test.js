import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemService } = await import('#service/customer-invoice-item.service.js');
const { NotFoundError, ConflictError } = await import('#configs/error.js');

describe('CustomerInvoiceItemService.addItem', () => {
  it('creates a line item on a draft invoice owned by the customer, using the Item catalog price', async () => {
    const created = { id: 'ii1' };
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.itemRepository = { findByPk: jest.fn().mockResolvedValue({ id: 'item1', defaultCost: 45 }) };
    service.customerInvoiceItemRepository = { createItem: jest.fn().mockResolvedValue(created) };

    const result = await service.addItem('c1', 'i1', {
      itemId: 'item1',
      description: 'Treatment',
      qty: 1,
      sortOrder: 0,
    });

    expect(service.customerInvoiceItemRepository.createItem).toHaveBeenCalledWith({
      customerInvoiceId: 'i1',
      itemId: 'item1',
      description: 'Treatment',
      cost: 45,
      qty: 1,
      sortOrder: 0,
    });
    expect(result).toBe(created);
  });

  it('ignores any client-supplied cost and never lets it reach the repository', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.itemRepository = { findByPk: jest.fn().mockResolvedValue({ id: 'item1', defaultCost: 45 }) };
    service.customerInvoiceItemRepository = { createItem: jest.fn().mockResolvedValue({ id: 'ii1' }) };

    await service.addItem('c1', 'i1', { itemId: 'item1', qty: 1, cost: -9999 });

    expect(service.customerInvoiceItemRepository.createItem).toHaveBeenCalledWith(
      expect.objectContaining({ cost: 45 }),
    );
  });

  it('throws NotFoundError when the referenced item does not exist', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.itemRepository = { findByPk: jest.fn().mockResolvedValue(null) };
    service.customerInvoiceItemRepository = { createItem: jest.fn() };

    await expect(service.addItem('c1', 'i1', { itemId: 'missing-item', qty: 1 })).rejects.toThrow(NotFoundError);
    expect(service.customerInvoiceItemRepository.createItem).not.toHaveBeenCalled();
  });

  it('throws ConflictError when the invoice is not a draft', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'sent' }),
    };
    service.customerInvoiceItemRepository = { createItem: jest.fn() };

    await expect(service.addItem('c1', 'i1', { itemId: 'item1' })).rejects.toThrow(ConflictError);
    expect(service.customerInvoiceItemRepository.createItem).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the invoice belongs to another customer', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(null) };
    service.customerInvoiceItemRepository = { createItem: jest.fn() };

    await expect(service.addItem('c1', 'someone-elses-invoice', { itemId: 'item1' })).rejects.toThrow(NotFoundError);
  });
});

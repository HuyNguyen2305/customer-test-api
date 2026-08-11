import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemService } = await import('#service/customer-invoice-item.service.js');
const { NotFoundError, ConflictError } = await import('#configs/error.js');

describe('CustomerInvoiceItemService.addItem', () => {
  it('creates a line item on a draft invoice owned by the customer', async () => {
    const created = { id: 'ii1' };
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.customerInvoiceItemRepository = { createItem: jest.fn().mockResolvedValue(created) };

    const result = await service.addItem('c1', 'i1', {
      itemId: 'item1',
      description: 'Treatment',
      cost: 100,
      qty: 1,
      sortOrder: 0,
    });

    expect(service.customerInvoiceItemRepository.createItem).toHaveBeenCalledWith({
      customerInvoiceId: 'i1',
      itemId: 'item1',
      description: 'Treatment',
      cost: 100,
      qty: 1,
      sortOrder: 0,
    });
    expect(result).toBe(created);
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

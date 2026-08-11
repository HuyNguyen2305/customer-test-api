import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemService } = await import('#service/customer-invoice-item.service.js');
const { NotFoundError, ConflictError } = await import('#configs/error.js');

describe('CustomerInvoiceItemService.updateItem', () => {
  it('updates a line item on a draft invoice owned by the customer', async () => {
    const updated = { id: 'ii1', cost: 150 };
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.customerInvoiceItemRepository = { updateItem: jest.fn().mockResolvedValue(updated) };

    const result = await service.updateItem('c1', 'i1', 'ii1', { cost: 150 });

    expect(service.customerInvoiceItemRepository.updateItem).toHaveBeenCalledWith('ii1', 'i1', { cost: 150 });
    expect(result).toBe(updated);
  });

  it('throws ConflictError when the invoice is not a draft', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'paid' }),
    };
    service.customerInvoiceItemRepository = { updateItem: jest.fn() };

    await expect(service.updateItem('c1', 'i1', 'ii1', { cost: 150 })).rejects.toThrow(ConflictError);
    expect(service.customerInvoiceItemRepository.updateItem).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the item does not exist on that invoice', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.customerInvoiceItemRepository = { updateItem: jest.fn().mockResolvedValue(null) };

    await expect(service.updateItem('c1', 'i1', 'missing-item', { cost: 150 })).rejects.toThrow(NotFoundError);
  });
});

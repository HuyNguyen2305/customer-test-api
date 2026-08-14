import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemService } = await import('#service/customer-invoice-item.service.js');
const { NotFoundError, ConflictError } = await import('#configs/error.js');

describe('CustomerInvoiceItemService.updateItem', () => {
  it('updates a line item on a draft invoice owned by the customer', async () => {
    const updated = { id: 'ii1', qty: 3 };
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.customerInvoiceItemRepository = { updateItem: jest.fn().mockResolvedValue(updated) };

    const result = await service.updateItem('c1', 'i1', 'ii1', { qty: 3 });

    expect(service.customerInvoiceItemRepository.updateItem).toHaveBeenCalledWith('ii1', 'i1', {
      description: undefined,
      qty: 3,
      sortOrder: undefined,
    });
    expect(result).toBe(updated);
  });

  it('never forwards a cost field to the repository, even if present on the raw input', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.customerInvoiceItemRepository = { updateItem: jest.fn().mockResolvedValue({ id: 'ii1' }) };

    await service.updateItem('c1', 'i1', 'ii1', { qty: 2, cost: -9999 });

    const [, , calledData] = service.customerInvoiceItemRepository.updateItem.mock.calls[0];
    expect(calledData).not.toHaveProperty('cost');
  });

  it('throws ConflictError when the invoice is not a draft', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'paid' }),
    };
    service.customerInvoiceItemRepository = { updateItem: jest.fn() };

    await expect(service.updateItem('c1', 'i1', 'ii1', { qty: 2 })).rejects.toThrow(ConflictError);
    expect(service.customerInvoiceItemRepository.updateItem).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the item does not exist on that invoice', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.customerInvoiceItemRepository = { updateItem: jest.fn().mockResolvedValue(null) };

    await expect(service.updateItem('c1', 'i1', 'missing-item', { qty: 2 })).rejects.toThrow(NotFoundError);
  });
});

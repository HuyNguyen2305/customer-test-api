import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemService } = await import('#service/customer-invoice-item.service.js');
const { NotFoundError, ConflictError } = await import('#configs/error.js');

describe('CustomerInvoiceItemService.removeItem', () => {
  it('deletes a line item on a draft invoice owned by the customer', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.customerInvoiceItemRepository = { deleteItem: jest.fn().mockResolvedValue(true) };

    await service.removeItem('c1', 'i1', 'ii1');

    expect(service.customerInvoiceItemRepository.deleteItem).toHaveBeenCalledWith('ii1', 'i1');
  });

  it('throws ConflictError when the invoice is not a draft', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'void' }),
    };
    service.customerInvoiceItemRepository = { deleteItem: jest.fn() };

    await expect(service.removeItem('c1', 'i1', 'ii1')).rejects.toThrow(ConflictError);
    expect(service.customerInvoiceItemRepository.deleteItem).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the item does not exist on that invoice', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.customerInvoiceItemRepository = { deleteItem: jest.fn().mockResolvedValue(false) };

    await expect(service.removeItem('c1', 'i1', 'missing-item')).rejects.toThrow(NotFoundError);
  });
});

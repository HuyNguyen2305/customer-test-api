import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemService } = await import('#service/customer-invoice-item.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerInvoiceItemService.listItems', () => {
  it('returns the line items once the invoice is confirmed owned by the customer', async () => {
    const items = [{ id: 'ii1' }];
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'sent' }) };
    service.customerInvoiceItemRepository = { listByInvoiceId: jest.fn().mockResolvedValue(items) };

    const result = await service.listItems('c1', 'i1');

    expect(service.customerInvoiceRepository.findByIdForCustomer).toHaveBeenCalledWith('i1', 'c1');
    expect(service.customerInvoiceItemRepository.listByInvoiceId).toHaveBeenCalledWith('i1');
    expect(result).toBe(items);
  });

  it('throws NotFoundError when the invoice belongs to another customer, without listing items', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(null) };
    service.customerInvoiceItemRepository = { listByInvoiceId: jest.fn() };

    await expect(service.listItems('c1', 'someone-elses-invoice')).rejects.toThrow(NotFoundError);
    expect(service.customerInvoiceItemRepository.listByInvoiceId).not.toHaveBeenCalled();
  });
});

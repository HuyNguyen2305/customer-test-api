import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemService } = await import('#service/customer-invoice-item.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerInvoiceItemService.listItems', () => {
  it('returns the line items once the invoice is confirmed owned by the customer', async () => {
    const items = [
      { id: 'ii1', parentId: 'i1', parentType: 'invoice', itemId: 'item1', cost: 45, qty: 1, sortOrder: 0 },
    ];
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'sent' }),
    };
    service.customerLineItemRepository = { listByParent: jest.fn().mockResolvedValue(items) };

    const result = await service.listItems('c1', 'i1');

    expect(service.customerInvoiceRepository.findSummaryByIdForCustomer).toHaveBeenCalledWith('i1', 'c1');
    expect(service.customerLineItemRepository.listByParent).toHaveBeenCalledWith('i1', 'invoice');
    expect(result[0]).toMatchObject({ id: 'ii1', itemId: 'item1', cost: 45, qty: 1 });
  });

  it('throws NotFoundError when the invoice belongs to another customer, without listing items', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = { findSummaryByIdForCustomer: jest.fn().mockResolvedValue(null) };
    service.customerLineItemRepository = { listByParent: jest.fn() };

    await expect(service.listItems('c1', 'someone-elses-invoice')).rejects.toThrow(NotFoundError);
    expect(service.customerLineItemRepository.listByParent).not.toHaveBeenCalled();
  });
});

import { jest } from '@jest/globals';

const FAKE_TRANSACTION = { id: 'fake-transaction' };
const transactionMock = jest.fn((fn) => fn(FAKE_TRANSACTION));

jest.unstable_mockModule('#common/sequelize.js', () => ({
  sequelize: { transaction: transactionMock },
}));

const { default: CustomerInvoiceItemService } = await import('#service/customer-invoice-item.service.js');
const { NotFoundError, ConflictError } = await import('#configs/error.js');

function buildInvoiceItemRepository({ deleted, listed = [] } = {}) {
  return {
    deleteItem: jest.fn().mockResolvedValue(deleted),
    listByParent: jest.fn().mockResolvedValue(listed),
    updateMany: jest.fn().mockResolvedValue(undefined),
  };
}

describe('CustomerInvoiceItemService.removeItem', () => {
  it('deletes a line item on a draft invoice owned by the customer', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest
        .fn()
        .mockResolvedValue({ id: 'i1', status: 'draft', discountType: 'flat', discountValue: 0 }),
    };
    service.customerLineItemRepository = buildInvoiceItemRepository({ deleted: true });

    await service.removeItem('c1', 'i1', 'ii1');

    expect(service.customerLineItemRepository.deleteItem).toHaveBeenCalledWith('ii1', 'i1', 'invoice', {
      transaction: FAKE_TRANSACTION,
    });
  });

  it('recomputes the remaining siblings after the delete, since the removed item shifted the shared discount ratio', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest
        .fn()
        .mockResolvedValue({ id: 'i1', status: 'draft', discountType: 'flat', discountValue: 0 }),
    };
    const remaining = { id: 'ii2', cost: 30, qty: 1, taxSlots: { tax1Rate: 5 } };
    service.customerLineItemRepository = buildInvoiceItemRepository({ deleted: true, listed: [remaining] });

    await service.removeItem('c1', 'i1', 'ii1');

    expect(service.customerLineItemRepository.listByParent).toHaveBeenCalledWith('i1', 'invoice', {
      transaction: FAKE_TRANSACTION,
    });
    expect(service.customerLineItemRepository.updateMany).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'ii2' })],
      { transaction: FAKE_TRANSACTION },
    );
  });

  it('throws ConflictError when the invoice is not a draft', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'void' }),
    };
    service.customerLineItemRepository = buildInvoiceItemRepository();

    await expect(service.removeItem('c1', 'i1', 'ii1')).rejects.toThrow(ConflictError);
    expect(service.customerLineItemRepository.deleteItem).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the item does not exist on that invoice', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.customerLineItemRepository = buildInvoiceItemRepository({ deleted: false });

    await expect(service.removeItem('c1', 'i1', 'missing-item')).rejects.toThrow(NotFoundError);
  });
});

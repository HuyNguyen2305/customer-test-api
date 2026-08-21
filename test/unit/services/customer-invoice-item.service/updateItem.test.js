import { jest } from '@jest/globals';

const FAKE_TRANSACTION = { id: 'fake-transaction' };
const transactionMock = jest.fn((fn) => fn(FAKE_TRANSACTION));

jest.unstable_mockModule('#common/sequelize.js', () => ({
  sequelize: { transaction: transactionMock },
}));

const { default: CustomerInvoiceItemService } = await import('#service/customer-invoice-item.service.js');
const { NotFoundError, ConflictError } = await import('#configs/error.js');

function buildInvoiceItemRepository({ updated, listed = [], final } = {}) {
  return {
    updateItem: jest.fn().mockResolvedValue(updated),
    listByParent: jest.fn().mockResolvedValue(listed),
    updateMany: jest.fn().mockResolvedValue(undefined),
    findByPk: jest.fn().mockResolvedValue(final ?? updated),
  };
}

describe('CustomerInvoiceItemService.updateItem', () => {
  it('updates a line item on a draft invoice owned by the customer', async () => {
    const updated = { id: 'ii1', qty: 3 };
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest
        .fn()
        .mockResolvedValue({ id: 'i1', status: 'draft', discountType: 'flat', discountValue: 0 }),
    };
    service.customerLineItemRepository = buildInvoiceItemRepository({ updated, final: updated });

    const result = await service.updateItem('c1', 'i1', 'ii1', { qty: 3 });

    expect(service.customerLineItemRepository.updateItem).toHaveBeenCalledWith(
      'ii1',
      'i1',
      'invoice',
      { description: undefined, qty: 3, sortOrder: undefined },
      { transaction: FAKE_TRANSACTION },
    );
    expect(result).toMatchObject({ id: 'ii1', qty: 3 });
  });

  it('never forwards a cost field to the repository, even if present on the raw input', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest
        .fn()
        .mockResolvedValue({ id: 'i1', status: 'draft', discountType: 'flat', discountValue: 0 }),
    };
    service.customerLineItemRepository = buildInvoiceItemRepository({ updated: { id: 'ii1' } });

    await service.updateItem('c1', 'i1', 'ii1', { qty: 2, cost: -9999 });

    const [, , , calledData] = service.customerLineItemRepository.updateItem.mock.calls[0];
    expect(calledData).not.toHaveProperty('cost');
  });

  it('recomputes every sibling item on the invoice after updating, since the changed subtotal shifts the shared discount ratio', async () => {
    const updated = { id: 'ii1', qty: 2 };
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest
        .fn()
        .mockResolvedValue({ id: 'i1', status: 'draft', discountType: 'flat', discountValue: 20 }),
    };
    const sibling = { id: 'ii2', cost: 30, qty: 1, taxSlots: { tax1Rate: 5 } };
    service.customerLineItemRepository = buildInvoiceItemRepository({
      updated,
      listed: [{ id: 'ii1', cost: 50, qty: 2, taxSlots: { tax1Rate: null } }, sibling],
    });

    await service.updateItem('c1', 'i1', 'ii1', { qty: 2 });

    expect(service.customerLineItemRepository.listByParent).toHaveBeenCalledWith('i1', 'invoice', {
      transaction: FAKE_TRANSACTION,
    });
    expect(service.customerLineItemRepository.updateMany).toHaveBeenCalled();
  });

  it('throws ConflictError when the invoice is not a draft', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'paid' }),
    };
    service.customerLineItemRepository = buildInvoiceItemRepository();

    await expect(service.updateItem('c1', 'i1', 'ii1', { qty: 2 })).rejects.toThrow(ConflictError);
    expect(service.customerLineItemRepository.updateItem).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the item does not exist on that invoice', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.customerLineItemRepository = buildInvoiceItemRepository({ updated: null });

    await expect(service.updateItem('c1', 'i1', 'missing-item', { qty: 2 })).rejects.toThrow(NotFoundError);
  });
});

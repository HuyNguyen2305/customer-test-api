import { jest } from '@jest/globals';

const FAKE_TRANSACTION = { id: 'fake-transaction' };
const transactionMock = jest.fn((fn) => fn(FAKE_TRANSACTION));

// addItem() wraps the create + sibling-item recompute in sequelize.transaction()
// - stub the runner to just invoke its callback against plain mocked repos.
jest.unstable_mockModule('#common/sequelize.js', () => ({
  sequelize: { transaction: transactionMock },
}));

const { default: CustomerInvoiceItemService } = await import('#service/customer-invoice-item.service.js');
const { NotFoundError, ConflictError } = await import('#configs/error.js');

function buildInvoiceItemRepository({ created, listed = [], final } = {}) {
  return {
    createItem: jest.fn().mockResolvedValue(created),
    listByInvoiceId: jest.fn().mockResolvedValue(listed),
    updateMany: jest.fn().mockResolvedValue(undefined),
    findByPk: jest.fn().mockResolvedValue(final ?? created),
  };
}

describe('CustomerInvoiceItemService.addItem', () => {
  it('creates a line item on a draft invoice owned by the customer, using the Item catalog price', async () => {
    const created = { id: 'ii1' };
    const final = { id: 'ii1', cost: 45, qty: 1, subtotal: 45, total: 45 };
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest
        .fn()
        .mockResolvedValue({ id: 'i1', status: 'draft', discountType: 'flat', discountValue: 0 }),
    };
    service.itemRepository = { findByPk: jest.fn().mockResolvedValue({ id: 'item1', defaultCost: 45 }) };
    service.customerInvoiceItemRepository = buildInvoiceItemRepository({ created, final });

    const result = await service.addItem('c1', 'i1', {
      itemId: 'item1',
      description: 'Treatment',
      qty: 1,
      sortOrder: 0,
    });

    expect(service.customerInvoiceItemRepository.createItem).toHaveBeenCalledWith(
      { customerInvoiceId: 'i1', itemId: 'item1', description: 'Treatment', cost: 45, qty: 1, sortOrder: 0 },
      { transaction: FAKE_TRANSACTION },
    );
    expect(result).toMatchObject({ id: 'ii1', cost: 45, subtotal: 45, total: 45 });
  });

  it('ignores any client-supplied cost and never lets it reach the repository', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest
        .fn()
        .mockResolvedValue({ id: 'i1', status: 'draft', discountType: 'flat', discountValue: 0 }),
    };
    service.itemRepository = { findByPk: jest.fn().mockResolvedValue({ id: 'item1', defaultCost: 45 }) };
    service.customerInvoiceItemRepository = buildInvoiceItemRepository({ created: { id: 'ii1' } });

    await service.addItem('c1', 'i1', { itemId: 'item1', qty: 1, cost: -9999 });

    expect(service.customerInvoiceItemRepository.createItem).toHaveBeenCalledWith(
      expect.objectContaining({ cost: 45 }),
      expect.anything(),
    );
  });

  it('recomputes every sibling item on the invoice after adding, since the new subtotal shifts the shared discount ratio', async () => {
    const created = { id: 'ii2' };
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest
        .fn()
        .mockResolvedValue({ id: 'i1', status: 'draft', discountType: 'flat', discountValue: 20 }),
    };
    service.itemRepository = { findByPk: jest.fn().mockResolvedValue({ id: 'item2', defaultCost: 50 }) };
    const existingSibling = { id: 'ii1', cost: 30, qty: 1, taxSlots: { tax1Rate: 5 } };
    service.customerInvoiceItemRepository = buildInvoiceItemRepository({
      created,
      listed: [existingSibling, { id: 'ii2', cost: 50, qty: 1, taxSlots: { tax1Rate: null } }],
    });

    await service.addItem('c1', 'i1', { itemId: 'item2', qty: 1 });

    expect(service.customerInvoiceItemRepository.listByInvoiceId).toHaveBeenCalledWith('i1', {
      transaction: FAKE_TRANSACTION,
    });
    const [patches] = service.customerInvoiceItemRepository.updateMany.mock.calls[0];
    // subtotal 80, discount 20 -> ratio 0.25 -> sibling's taxable base 30*0.75=22.5, tax 5% = 1.125
    expect(patches.find((p) => p.id === 'ii1').taxSlots.tax1Total).toBe(1.125);
  });

  it('throws NotFoundError when the referenced item does not exist', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'draft' }),
    };
    service.itemRepository = { findByPk: jest.fn().mockResolvedValue(null) };
    service.customerInvoiceItemRepository = buildInvoiceItemRepository();

    await expect(service.addItem('c1', 'i1', { itemId: 'missing-item', qty: 1 })).rejects.toThrow(NotFoundError);
    expect(service.customerInvoiceItemRepository.createItem).not.toHaveBeenCalled();
  });

  it('throws ConflictError when the invoice is not a draft', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = {
      findSummaryByIdForCustomer: jest.fn().mockResolvedValue({ id: 'i1', status: 'sent' }),
    };
    service.customerInvoiceItemRepository = buildInvoiceItemRepository();

    await expect(service.addItem('c1', 'i1', { itemId: 'item1' })).rejects.toThrow(ConflictError);
    expect(service.customerInvoiceItemRepository.createItem).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the invoice belongs to another customer', async () => {
    const service = Object.create(CustomerInvoiceItemService.prototype);
    service.customerInvoiceRepository = { findSummaryByIdForCustomer: jest.fn().mockResolvedValue(null) };
    service.customerInvoiceItemRepository = buildInvoiceItemRepository();

    await expect(service.addItem('c1', 'someone-elses-invoice', { itemId: 'item1' })).rejects.toThrow(NotFoundError);
  });
});

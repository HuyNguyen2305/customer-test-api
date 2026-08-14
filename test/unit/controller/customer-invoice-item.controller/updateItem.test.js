import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerInvoiceItemController } = await import('#controller/customer-invoice-item.controller.js');
const { ConflictError } = await import('#configs/error.js');

describe('CustomerInvoiceItemController.updateItem', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('updates the line item and sends the updated row', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'ii1', qty: 3 };
    const controller = Object.create(CustomerInvoiceItemController.prototype);
    controller.customerInvoiceItemService = { updateItem: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { invoiceId: 'i1', itemId: 'ii1' }, body: { qty: 3 } };

    await controller.updateItem(request, reply);

    expect(controller.customerInvoiceItemService.updateItem).toHaveBeenCalledWith('c1', 'i1', 'ii1', {
      description: undefined,
      qty: 3,
      sortOrder: undefined,
    });
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Line item updated', data });
  });

  it('never forwards a client-supplied cost field, even if present in the request body', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(CustomerInvoiceItemController.prototype);
    controller.customerInvoiceItemService = { updateItem: jest.fn().mockResolvedValue({ id: 'ii1' }) };
    const reply = { send: jest.fn() };
    const request = { params: { invoiceId: 'i1', itemId: 'ii1' }, body: { qty: 2, cost: -9999 } };

    await controller.updateItem(request, reply);

    const [, , , calledData] = controller.customerInvoiceItemService.updateItem.mock.calls[0];
    expect(calledData).not.toHaveProperty('cost');
  });

  it('propagates ConflictError when the invoice is not a draft', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(CustomerInvoiceItemController.prototype);
    controller.customerInvoiceItemService = {
      updateItem: jest
        .fn()
        .mockRejectedValue(new ConflictError('Only draft invoices can have their line items changed')),
    };
    const request = { params: { invoiceId: 'i1', itemId: 'ii1' }, body: { qty: 2 } };

    await expect(controller.updateItem(request, { send: jest.fn() })).rejects.toThrow(ConflictError);
  });
});

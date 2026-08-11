import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerInvoiceItemController } = await import('#controller/customer-invoice-item.controller.js');

describe('CustomerInvoiceItemController.addItem', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('adds a line item from the body fields and sends the created row', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'ii1' };
    const controller = Object.create(CustomerInvoiceItemController.prototype);
    controller.customerInvoiceItemService = { addItem: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = {
      params: { invoiceId: 'i1' },
      body: { itemId: 'item1', description: 'Treatment', cost: 100, qty: 1, sortOrder: 0 },
    };

    await controller.addItem(request, reply);

    expect(controller.customerInvoiceItemService.addItem).toHaveBeenCalledWith('c1', 'i1', {
      itemId: 'item1',
      description: 'Treatment',
      cost: 100,
      qty: 1,
      sortOrder: 0,
    });
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Line item added', data });
  });
});

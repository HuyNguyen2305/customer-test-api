import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerInvoiceItemController } = await import('#controller/customer-invoice-item.controller.js');

describe('CustomerInvoiceItemController.listItems', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the line items for the authenticated customer and requested invoice', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = [{ id: 'ii1' }];
    const controller = Object.create(CustomerInvoiceItemController.prototype);
    controller.customerInvoiceItemService = { listItems: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { invoiceId: 'i1' } };

    await controller.listItems(request, reply);

    expect(controller.customerInvoiceItemService.listItems).toHaveBeenCalledWith('c1', 'i1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Line items retrieved', data });
  });
});

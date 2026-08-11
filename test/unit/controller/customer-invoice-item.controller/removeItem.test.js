import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerInvoiceItemController } = await import('#controller/customer-invoice-item.controller.js');

describe('CustomerInvoiceItemController.removeItem', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('removes the line item and sends a null-data response', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(CustomerInvoiceItemController.prototype);
    controller.customerInvoiceItemService = { removeItem: jest.fn().mockResolvedValue(undefined) };
    const reply = { send: jest.fn() };
    const request = { params: { invoiceId: 'i1', itemId: 'ii1' } };

    await controller.removeItem(request, reply);

    expect(controller.customerInvoiceItemService.removeItem).toHaveBeenCalledWith('c1', 'i1', 'ii1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Line item removed', data: null });
  });
});

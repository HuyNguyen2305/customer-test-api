import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerInvoiceController } = await import('#controller/customer-invoice.controller.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerInvoiceController.getInvoiceById', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the invoice for the authenticated customer and requested id', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'i1' };
    const controller = Object.create(CustomerInvoiceController.prototype);
    controller.customerInvoiceService = { getInvoiceById: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'i1' } };

    await controller.getInvoiceById(request, reply);

    expect(controller.customerInvoiceService.getInvoiceById).toHaveBeenCalledWith('i1', 'c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Invoice retrieved', data });
  });

  it('propagates NotFoundError when the invoice belongs to another customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(CustomerInvoiceController.prototype);
    controller.customerInvoiceService = {
      getInvoiceById: jest.fn().mockRejectedValue(new NotFoundError('Invoice not found')),
    };
    const request = { params: { id: 'other-customers-invoice' } };

    await expect(controller.getInvoiceById(request, { send: jest.fn() })).rejects.toThrow(NotFoundError);
  });
});

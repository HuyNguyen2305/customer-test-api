import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { default: InvoiceController } = await import('#controller/invoice.controller.js');

describe('InvoiceController.getInvoiceById', () => {
  beforeEach(() => getMock.mockReset());

  it('sends the invoice for the identity customerId and params id', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
    const data = { id: 'i1', amount: 10 };
    const controller = Object.create(InvoiceController.prototype);
    controller.invoiceService = { getInvoiceById: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'i1' } };

    await controller.getInvoiceById(request, reply);

    expect(controller.invoiceService.getInvoiceById).toHaveBeenCalledWith('i1', 'c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Invoice retrieved', data });
  });

  it('passes undefined customerId when there is no identity', async () => {
    getMock.mockReturnValue(undefined);
    const controller = Object.create(InvoiceController.prototype);
    controller.invoiceService = { getInvoiceById: jest.fn().mockResolvedValue({}) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'i1' } };

    await controller.getInvoiceById(request, reply);

    expect(controller.invoiceService.getInvoiceById).toHaveBeenCalledWith('i1', undefined);
  });
});

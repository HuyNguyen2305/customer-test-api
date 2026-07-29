import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { default: InvoiceController } = await import('#controller/invoice.controller.js');

describe('InvoiceController.listInvoices', () => {
  beforeEach(() => getMock.mockReset());

  it('sends the invoices and pagination for the identity customerId', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
    const invoices = [{ id: 'i1' }];
    const pagination = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    const controller = Object.create(InvoiceController.prototype);
    controller.invoiceService = { listInvoices: jest.fn().mockResolvedValue({ invoices, pagination }) };
    const reply = { send: jest.fn() };
    const request = { query: { page: 1, pageSize: 20, status: 'open' } };

    await controller.listInvoices(request, reply);

    expect(controller.invoiceService.listInvoices).toHaveBeenCalledWith('c1', {
      page: 1,
      pageSize: 20,
      status: 'open',
    });
    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      message: 'Invoices retrieved',
      data: invoices,
      pagination,
    });
  });

  it('passes undefined customerId when there is no identity', async () => {
    getMock.mockReturnValue(undefined);
    const controller = Object.create(InvoiceController.prototype);
    controller.invoiceService = { listInvoices: jest.fn().mockResolvedValue({ invoices: [], pagination: {} }) };
    const reply = { send: jest.fn() };
    const request = { query: {} };

    await controller.listInvoices(request, reply);

    expect(controller.invoiceService.listInvoices).toHaveBeenCalledWith(undefined, {
      page: undefined,
      pageSize: undefined,
      status: undefined,
    });
  });
});

import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerInvoiceController } = await import('#controller/customer-invoice.controller.js');

describe('CustomerInvoiceController.listInvoices', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends invoices and pagination for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const invoices = [{ id: 'i1' }];
    const pagination = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    const controller = Object.create(CustomerInvoiceController.prototype);
    controller.customerInvoiceService = { listInvoices: jest.fn().mockResolvedValue({ invoices, pagination }) };
    const reply = { send: jest.fn() };
    const request = { query: { page: 1, pageSize: 20 } };

    await controller.listInvoices(request, reply);

    expect(controller.customerInvoiceService.listInvoices).toHaveBeenCalledWith('c1', { page: 1, pageSize: 20 });
    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      message: 'Invoices retrieved',
      data: invoices,
      pagination,
    });
  });

  it('forwards addressId, status, and statusOrder query params to the service', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(CustomerInvoiceController.prototype);
    controller.customerInvoiceService = {
      listInvoices: jest.fn().mockResolvedValue({ invoices: [], pagination: {} }),
    };
    const request = { query: { addressId: 'a1', status: 'sent', statusOrder: 'asc' } };

    await controller.listInvoices(request, { send: jest.fn() });

    expect(controller.customerInvoiceService.listInvoices).toHaveBeenCalledWith('c1', {
      page: undefined,
      pageSize: undefined,
      addressId: 'a1',
      status: 'sent',
      statusOrder: 'asc',
    });
  });
});

import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerInvoiceController } = await import('#controller/customer-invoice.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('CustomerInvoiceController.getInvoicePdf', () => {
  beforeEach(() => {
    requireCustomerIdMock.mockReset();
  });

  it('streams the generated PDF inline with the correct headers', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const buffer = Buffer.from('%PDF-fake');
    const controller = Object.create(CustomerInvoiceController.prototype);
    controller.invoicePdfService = { getInvoicePdf: jest.fn().mockResolvedValue({ buffer }) };
    const sendResult = Symbol('sendResult');
    const reply = {
      header: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnValue(sendResult),
    };
    const request = { params: { id: 'i1' } };

    const result = await controller.getInvoicePdf(request, reply);

    expect(controller.invoicePdfService.getInvoicePdf).toHaveBeenCalledWith('i1', 'c1');
    expect(reply.header).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="invoice-i1.pdf"');
    expect(reply.type).toHaveBeenCalledWith('application/pdf');
    expect(reply.send).toHaveBeenCalledWith(buffer);
    // Fastify silently drops payloads from an async handler unless the
    // reply.send(...) chain is returned, so this return is load-bearing, not stylistic.
    expect(result).toBe(sendResult);
  });

  it('rejects when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(CustomerInvoiceController.prototype);
    controller.invoicePdfService = { getInvoicePdf: jest.fn() };

    await expect(
      controller.getInvoicePdf({ params: { id: 'i1' } }, { header: jest.fn(), type: jest.fn(), send: jest.fn() }),
    ).rejects.toThrow(UnauthorizedError);
    expect(controller.invoicePdfService.getInvoicePdf).not.toHaveBeenCalled();
  });
});

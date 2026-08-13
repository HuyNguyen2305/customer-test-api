import { jest } from '@jest/globals';

const buildInvoicePdfMock = jest.fn();

jest.unstable_mockModule('#common/pdf/invoice-pdf-builder.js', () => ({
  buildInvoicePdf: buildInvoicePdfMock,
  default: buildInvoicePdfMock,
}));

const { default: InvoicePdfService } = await import('#service/invoice-pdf.service.js');
const { NotFoundError } = await import('#configs/error.js');

const baseInvoice = {
  id: 'i1',
  customerId: 'c1',
  status: 'sent',
  balanceDue: 65,
  Customer: { id: 'c1', firstName: 'Jane', lastName: 'Doe' },
};

describe('InvoicePdfService.getInvoicePdf', () => {
  beforeEach(() => {
    buildInvoicePdfMock.mockReset();
  });

  it('builds the PDF from the invoice, the customer, and the cross-invoice account balance', async () => {
    const buffer = Buffer.from('%PDF-fake');
    buildInvoicePdfMock.mockResolvedValue(buffer);
    const service = Object.create(InvoicePdfService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue(baseInvoice),
      sumBalanceDueByCustomerId: jest.fn().mockResolvedValue(130),
    };

    const result = await service.getInvoicePdf('i1', 'c1');

    expect(service.customerInvoiceRepository.findByIdForCustomer).toHaveBeenCalledWith('i1', 'c1');
    expect(service.customerInvoiceRepository.sumBalanceDueByCustomerId).toHaveBeenCalledWith('c1');
    expect(buildInvoicePdfMock).toHaveBeenCalledTimes(1);
    const [invoiceData, options] = buildInvoicePdfMock.mock.calls[0];
    expect(invoiceData.id).toBe('i1');
    expect(options.customer).toBe(baseInvoice.Customer);
    expect(options.accountBalance).toBe(130);
    expect(result).toEqual({ buffer });
  });

  it('throws NotFoundError (never leaking existence) when the invoice belongs to another customer', async () => {
    const service = Object.create(InvoicePdfService.prototype);
    service.customerInvoiceRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue(null),
      sumBalanceDueByCustomerId: jest.fn(),
    };

    await expect(service.getInvoicePdf('i1', 'someone-else')).rejects.toThrow(NotFoundError);
    expect(service.customerInvoiceRepository.sumBalanceDueByCustomerId).not.toHaveBeenCalled();
    expect(buildInvoicePdfMock).not.toHaveBeenCalled();
  });
});

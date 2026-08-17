import { NotFoundError } from '#configs/error.js';
import { toInvoiceData } from '#service/customer-invoice.service.js';
import { buildInvoicePdf } from '#common/pdf/invoice-pdf-builder.js';
import { branding } from '#common/pdf/branding.config.js';

class InvoicePdfService {
  constructor({ customerInvoiceRepository }) {
    this.customerInvoiceRepository = customerInvoiceRepository;
  }

  async getInvoicePdf(id, customerId) {
    const invoice = await this.customerInvoiceRepository.findByIdForPdf(id, customerId);
    if (!invoice) throw new NotFoundError('Invoice not found');

    const invoiceData = toInvoiceData(invoice);
    const accountBalance = await this.customerInvoiceRepository.sumBalanceDueByCustomerId(customerId);

    const buffer = await buildInvoicePdf(invoiceData, {
      customer: invoice.Customer,
      accountBalance,
      branding,
    });

    return { buffer };
  }
}

export default InvoicePdfService;

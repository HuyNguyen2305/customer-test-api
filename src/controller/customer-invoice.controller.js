import { requireCustomerId } from '#common/require-customer-id.js';

class CustomerInvoiceController {
  constructor({ customerInvoiceService, invoicePdfService }) {
    this.customerInvoiceService = customerInvoiceService;
    this.invoicePdfService = invoicePdfService;
  }

  async listInvoices(request, reply) {
    const customerId = requireCustomerId();
    const { page, pageSize, addressId, status, statusOrder } = request.query;
    const { invoices, pagination } = await this.customerInvoiceService.listInvoices(customerId, {
      page,
      pageSize,
      addressId,
      status,
      statusOrder,
    });
    reply.send({ success: true, message: 'Invoices retrieved', data: invoices, pagination });
  }

  async getInvoiceById(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerInvoiceService.getInvoiceById(request.params.id, customerId);
    reply.send({ success: true, message: 'Invoice retrieved', data });
  }

  async getInvoicePdf(request, reply) {
    const customerId = requireCustomerId();
    const { buffer } = await this.invoicePdfService.getInvoicePdf(request.params.id, customerId);
    return reply
      .header('Content-Disposition', `inline; filename="invoice-${request.params.id}.pdf"`)
      .type('application/pdf')
      .send(buffer);
  }
}

export default CustomerInvoiceController;

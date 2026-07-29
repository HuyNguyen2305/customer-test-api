import { requestContext } from '#common/request-context.js';

class InvoiceController {
  constructor({ invoiceService }) {
    this.invoiceService = invoiceService;
  }

  async listInvoices(request, reply) {
    const { customerId } = requestContext.get('identity') ?? {};
    const { page, pageSize, status } = request.query;
    const { invoices, pagination } = await this.invoiceService.listInvoices(customerId, {
      page,
      pageSize,
      status,
    });
    reply.send({ success: true, message: 'Invoices retrieved', data: invoices, pagination });
  }

  async getInvoiceById(request, reply) {
    const { customerId } = requestContext.get('identity') ?? {};
    const data = await this.invoiceService.getInvoiceById(request.params.id, customerId);
    reply.send({ success: true, message: 'Invoice retrieved', data });
  }
}

export default InvoiceController;

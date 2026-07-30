import { requireCustomerId } from '#common/require-customer-id.js';

class CustomerInvoiceController {
  constructor({ customerInvoiceService }) {
    this.customerInvoiceService = customerInvoiceService;
  }

  async listInvoices(request, reply) {
    const customerId = requireCustomerId();
    const { page, pageSize } = request.query;
    const { invoices, pagination } = await this.customerInvoiceService.listInvoices(customerId, { page, pageSize });
    reply.send({ success: true, message: 'Invoices retrieved', data: invoices, pagination });
  }

  async getInvoiceById(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerInvoiceService.getInvoiceById(request.params.id, customerId);
    reply.send({ success: true, message: 'Invoice retrieved', data });
  }
}

export default CustomerInvoiceController;

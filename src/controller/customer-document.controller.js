import { requireCustomerId } from '#common/require-customer-id.js';

class CustomerDocumentController {
  constructor({ customerDocumentService }) {
    this.customerDocumentService = customerDocumentService;
  }

  async listDocuments(request, reply) {
    const customerId = requireCustomerId();
    const { page, pageSize } = request.query;
    const { documents, pagination } = await this.customerDocumentService.listDocuments(customerId, {
      page,
      pageSize,
    });
    reply.send({ success: true, message: 'Documents retrieved', data: documents, pagination });
  }
}

export default CustomerDocumentController;

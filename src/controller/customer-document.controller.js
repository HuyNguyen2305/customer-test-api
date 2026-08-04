import fs from 'node:fs';
import { requireCustomerId } from '#common/require-customer-id.js';
import { getContentType } from '#common/storage/content-type.util.js';

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

  async downloadDocument(request, reply) {
    const customerId = requireCustomerId();
    const { file, absolutePath } = await this.customerDocumentService.downloadDocument(request.params.id, customerId);
    return reply
      .header('Content-Disposition', `attachment; filename="${file.originalFileName}"`)
      .type(getContentType(file.originalFileName))
      .send(fs.createReadStream(absolutePath));
  }
}

export default CustomerDocumentController;

import fs from 'node:fs';
import { requireCustomerId } from '#common/require-customer-id.js';
import { BadRequestError } from '#configs/error.js';

class DocumentController {
  constructor({ documentService }) {
    this.documentService = documentService;
  }

  async listDocuments(request, reply) {
    const customerId = requireCustomerId();
    const { page, pageSize } = request.query;
    const { documents, pagination } = await this.documentService.listDocuments(customerId, {
      page,
      pageSize,
    });
    reply.send({ success: true, message: 'Documents retrieved', data: documents, pagination });
  }

  async getDocumentById(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.documentService.getDocumentById(request.params.id, customerId);
    reply.send({ success: true, message: 'Document retrieved', data });
  }

  async downloadDocument(request, reply) {
    const customerId = requireCustomerId();
    const { document, absolutePath } = await this.documentService.downloadDocument(request.params.id, customerId);
    return reply
      .header('Content-Disposition', `attachment; filename="${document.originalFileName}"`)
      .type(document.type || 'application/octet-stream')
      .send(fs.createReadStream(absolutePath));
  }

  async createDocument(request, reply) {
    const customerId = requireCustomerId();
    const filePart = request.body?.file;
    if (!filePart) throw new BadRequestError('A file is required');

    const data = await this.documentService.createDocument(customerId, {
      title: request.body.title?.value,
      type: filePart.mimetype,
      fileStream: filePart.file,
      originalFileName: filePart.filename,
    });
    reply.send({ success: true, message: 'Document created', data });
  }
}

export default DocumentController;

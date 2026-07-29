import { NotFoundError, BadRequestError } from '#configs/error.js';
import { saveFile, getAbsolutePath, fileExists } from '#common/storage/local-storage.js';

class DocumentService {
  constructor({ documentRepository }) {
    this.documentRepository = documentRepository;
  }

  async listDocuments(customerId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.documentRepository.listDocuments(customerId, {
      limit: pageSize,
      offset,
    });
    return {
      documents: rows,
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async getDocumentById(id, customerId) {
    const document = await this.documentRepository.getDocumentById(id, customerId);
    if (!document) throw new NotFoundError('Document not found');
    return document;
  }

  async downloadDocument(id, customerId) {
    const document = await this.documentRepository.downloadDocument(id, customerId);
    if (!document) throw new NotFoundError('Document not found');
    if (!(await fileExists(document.filePath))) throw new NotFoundError('Document file not found');
    return { document, absolutePath: getAbsolutePath(document.filePath) };
  }

  async createDocument(customerId, { title, type, fileStream, originalFileName } = {}) {
    if (!fileStream || !originalFileName) throw new BadRequestError('A file is required');
    const { filePath, fileSize } = await saveFile(fileStream, originalFileName);
    return this.documentRepository.createDocument({
      customerId,
      title,
      type,
      filePath,
      originalFileName,
      fileSize,
    });
  }
}

export default DocumentService;

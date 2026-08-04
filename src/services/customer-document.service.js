import { NotFoundError } from '#configs/error.js';
import { getAbsolutePath, fileExists } from '#common/storage/local-storage.js';

class CustomerDocumentService {
  constructor({ customerDocumentRepository }) {
    this.customerDocumentRepository = customerDocumentRepository;
  }

  async listDocuments(customerId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.customerDocumentRepository.listByCustomerId(customerId, {
      limit: pageSize,
      offset,
    });
    const documents = rows.map((row) => ({
      id: row.id,
      type: row.type,
      name: row.type === 'doc' ? (row.ServiceDocumentLibrary?.name ?? null) : (row.Pdf?.name ?? null),
      bookingId: row.bookingId,
      createdAt: row.createdAt,
    }));
    return {
      documents,
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async downloadDocument(id, customerId) {
    const customerDocument = await this.customerDocumentRepository.findByIdForCustomer(id, customerId);
    if (!customerDocument) throw new NotFoundError('Document not found');

    const file = customerDocument.type === 'doc' ? customerDocument.ServiceDocumentLibrary : customerDocument.Pdf;
    if (!file) throw new NotFoundError('Document not found');
    if (!(await fileExists(file.filePath))) throw new NotFoundError('Document file not found');

    return { file, absolutePath: getAbsolutePath(file.filePath) };
  }
}

export default CustomerDocumentService;

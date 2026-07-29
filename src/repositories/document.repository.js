import { BaseRepository } from '#common/base-repository.js';

class DocumentRepository extends BaseRepository {
  constructor({ documentModel }) {
    super(documentModel);
  }

  listDocuments(customerId, { limit, offset } = {}) {
    return this.findAndCountAll({
      where: { customerId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  }

  getDocumentById(id, customerId) {
    return this.findOne({ where: { id, customerId } });
  }

  downloadDocument(id, customerId) {
    return this.getDocumentById(id, customerId);
  }

  createDocument(data) {
    return this.create(data);
  }
}

export default DocumentRepository;

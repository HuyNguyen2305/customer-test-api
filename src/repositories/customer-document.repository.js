import { BaseRepository } from '#common/base-repository.js';

class CustomerDocumentRepository extends BaseRepository {
  constructor({ customerDocumentModel, serviceDocumentLibraryModel, pdfModel }) {
    super(customerDocumentModel);
    this.serviceDocumentLibraryModel = serviceDocumentLibraryModel;
    this.pdfModel = pdfModel;
  }

  listByCustomerId(customerId, { limit, offset } = {}) {
    return this.findAndCountAll({
      where: { customerId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: this.scopeModel(this.serviceDocumentLibraryModel) },
        { model: this.scopeModel(this.pdfModel) },
      ],
    });
  }

  findByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      include: [
        { model: this.scopeModel(this.serviceDocumentLibraryModel) },
        { model: this.scopeModel(this.pdfModel) },
      ],
    });
  }
}

export default CustomerDocumentRepository;

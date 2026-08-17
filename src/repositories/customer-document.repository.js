import { BaseRepository } from '#common/base-repository.js';

class CustomerDocumentRepository extends BaseRepository {
  constructor({ customerDocumentModel, serviceDocumentLibraryModel, pdfModel }) {
    super(customerDocumentModel);
    this.serviceDocumentLibraryModel = serviceDocumentLibraryModel;
    this.pdfModel = pdfModel;
  }

  // listDocuments only reads row.type/.bookingId/.createdAt off the base row,
  // and .name off whichever of the two joins matches row.type.
  listByCustomerId(customerId, { limit, offset } = {}) {
    return this.findAndCountAll({
      where: { customerId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['customerId', 'documentId', 'pdfId', 'updatedAt'] },
      include: [
        { model: this.scopeModel(this.serviceDocumentLibraryModel), attributes: ['name'] },
        { model: this.scopeModel(this.pdfModel), attributes: ['name'] },
      ],
    });
  }

  // downloadDocument reads .filePath off the matched join (to stream the
  // file), and the controller reads .originalFileName off the same join (for
  // the Content-Disposition header) - so both need all three, unlike the
  // list above.
  findByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: { exclude: ['customerId', 'documentId', 'pdfId', 'updatedAt'] },
      include: [
        {
          model: this.scopeModel(this.serviceDocumentLibraryModel),
          attributes: ['name', 'filePath', 'originalFileName'],
        },
        { model: this.scopeModel(this.pdfModel), attributes: ['name', 'filePath', 'originalFileName'] },
      ],
    });
  }
}

export default CustomerDocumentRepository;

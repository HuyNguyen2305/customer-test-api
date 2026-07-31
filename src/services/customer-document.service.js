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
}

export default CustomerDocumentService;

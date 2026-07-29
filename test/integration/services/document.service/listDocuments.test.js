import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import documentFixtures from '../../../fixtures/document.fixtures.cjs';

const { default: DocumentService } = await import('#service/document.service.js');
const { default: DocumentRepository } = await import('#repositories/document.repository.js');
const models = (await import('#models/index.js')).default;

function buildService() {
  const documentRepository = Object.create(DocumentRepository.prototype);
  documentRepository.model = models.Document;
  const service = Object.create(DocumentService.prototype);
  service.documentRepository = documentRepository;
  return service;
}

describe('DocumentService.listDocuments (integration)', () => {
  it('returns the paginated documents for the customer', async () => {
    await seedWithTransaction(
      {
        Document: [
          documentFixtures.documentContract,
          documentFixtures.documentPhoto,
          documentFixtures.documentOtherCustomer,
        ],
      },
      async () => {
        const service = buildService();

        const result = await service.listDocuments(documentFixtures.documentContract.customerId, {
          page: 1,
          pageSize: 10,
        });

        expect(result.documents).toHaveLength(2);
        expect(result.pagination).toEqual({ page: 1, pageSize: 10, total: 2, totalPages: 1 });
      },
    );
  });
});

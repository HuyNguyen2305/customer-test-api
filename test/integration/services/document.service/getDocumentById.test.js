import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import documentFixtures from '../../../fixtures/document.fixtures.cjs';

const { default: DocumentService } = await import('#service/document.service.js');
const { default: DocumentRepository } = await import('#repositories/document.repository.js');
const { NotFoundError } = await import('#configs/error.js');
const models = (await import('#models/index.js')).default;

function buildService() {
  const documentRepository = Object.create(DocumentRepository.prototype);
  documentRepository.model = models.Document;
  const service = Object.create(DocumentService.prototype);
  service.documentRepository = documentRepository;
  return service;
}

describe('DocumentService.getDocumentById (integration)', () => {
  it('returns the persisted document for the customer', async () => {
    await seedWithTransaction({ Document: [documentFixtures.documentContract] }, async ({ seeded }) => {
      const service = buildService();
      const seededDocument = seeded.Document[0];

      const result = await service.getDocumentById(seededDocument.id, documentFixtures.documentContract.customerId);

      expect(result.title).toBe(documentFixtures.documentContract.title);
    });
  });

  it('throws NotFoundError when the document does not belong to the customer', async () => {
    await seedWithTransaction({ Document: [documentFixtures.documentContract] }, async ({ seeded }) => {
      const service = buildService();
      const seededDocument = seeded.Document[0];

      await expect(
        service.getDocumentById(seededDocument.id, documentFixtures.documentOtherCustomer.customerId),
      ).rejects.toThrow(NotFoundError);
    });
  });
});

import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import documentFixtures from '../../../fixtures/document.fixtures.cjs';

const { default: DocumentRepository } = await import('#repositories/document.repository.js');
const models = (await import('#models/index.js')).default;

describe('DocumentRepository.getDocumentById (integration)', () => {
  it('reads back the seeded document row scoped to the customer', async () => {
    await seedWithTransaction({ Document: [documentFixtures.documentContract] }, async ({ seeded }) => {
      const repository = Object.create(DocumentRepository.prototype);
      repository.model = models.Document;
      const seededDocument = seeded.Document[0];

      const result = await repository.getDocumentById(seededDocument.id, documentFixtures.documentContract.customerId);

      expect(result).not.toBeNull();
      expect(result.title).toBe(documentFixtures.documentContract.title);
    });
  });

  it('returns null when the document belongs to a different customer', async () => {
    await seedWithTransaction({ Document: [documentFixtures.documentContract] }, async ({ seeded }) => {
      const repository = Object.create(DocumentRepository.prototype);
      repository.model = models.Document;
      const seededDocument = seeded.Document[0];

      const result = await repository.getDocumentById(
        seededDocument.id,
        documentFixtures.documentOtherCustomer.customerId,
      );

      expect(result).toBeNull();
    });
  });
});

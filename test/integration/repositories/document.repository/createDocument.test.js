import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import documentFixtures from '../../../fixtures/document.fixtures.cjs';

const { default: DocumentRepository } = await import('#repositories/document.repository.js');
const models = (await import('#models/index.js')).default;

describe('DocumentRepository.createDocument (integration)', () => {
  it('persists a new document row', async () => {
    await seedWithTransaction({ Document: [] }, async () => {
      const repository = Object.create(DocumentRepository.prototype);
      repository.model = models.Document;

      const created = await repository.createDocument({ ...documentFixtures.documentContract });

      expect(created.id).toBeDefined();
      const found = await repository.getDocumentById(created.id, documentFixtures.documentContract.customerId);
      expect(found).not.toBeNull();
      expect(found.title).toBe(documentFixtures.documentContract.title);
    });
  });
});

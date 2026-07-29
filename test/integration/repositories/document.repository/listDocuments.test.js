import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import documentFixtures from '../../../fixtures/document.fixtures.cjs';

const { default: DocumentRepository } = await import('#repositories/document.repository.js');
const models = (await import('#models/index.js')).default;

describe('DocumentRepository.listDocuments (integration)', () => {
  it('returns only the documents for the given customer', async () => {
    await seedWithTransaction(
      {
        Document: [
          documentFixtures.documentContract,
          documentFixtures.documentPhoto,
          documentFixtures.documentOtherCustomer,
        ],
      },
      async () => {
        const repository = Object.create(DocumentRepository.prototype);
        repository.model = models.Document;

        const result = await repository.listDocuments(documentFixtures.documentContract.customerId, {
          limit: 20,
          offset: 0,
        });

        expect(result.count).toBe(2);
      },
    );
  });
});

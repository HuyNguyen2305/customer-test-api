import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import documentFixtures from '../../../fixtures/document.fixtures.cjs';

const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'document-service-download-'));
process.env.UPLOAD_DIR = uploadDir;

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

describe('DocumentService.downloadDocument (integration)', () => {
  afterAll(() => fs.rm(uploadDir, { recursive: true, force: true }));

  it('returns the document and absolute path when the file exists on disk', async () => {
    const fileName = 'contract.pdf';
    await fs.writeFile(path.join(uploadDir, fileName), 'contract contents');

    await seedWithTransaction(
      { Document: [{ ...documentFixtures.documentContract, filePath: fileName }] },
      async ({ seeded }) => {
        const service = buildService();
        const seededDocument = seeded.Document[0];

        const result = await service.downloadDocument(seededDocument.id, documentFixtures.documentContract.customerId);

        expect(result.document.id).toBe(seededDocument.id);
        expect(result.absolutePath).toBe(path.join(uploadDir, fileName));
      },
    );
  });

  it('throws NotFoundError when the record exists but the file is missing from disk', async () => {
    await seedWithTransaction({ Document: [documentFixtures.documentContract] }, async ({ seeded }) => {
      const service = buildService();
      const seededDocument = seeded.Document[0];

      await expect(
        service.downloadDocument(seededDocument.id, documentFixtures.documentContract.customerId),
      ).rejects.toThrow(NotFoundError);
    });
  });
});

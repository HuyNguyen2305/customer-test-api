import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { Readable } from 'node:stream';
import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import documentFixtures from '../../../fixtures/document.fixtures.cjs';

const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'document-service-create-'));
process.env.UPLOAD_DIR = uploadDir;

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

describe('DocumentService.createDocument (integration)', () => {
  afterAll(() => fs.rm(uploadDir, { recursive: true, force: true }));

  it('saves the uploaded file to disk and persists the document record', async () => {
    await seedWithTransaction({ Document: [] }, async () => {
      const service = buildService();
      const fileStream = Readable.from(Buffer.from('contract contents'));

      const result = await service.createDocument(documentFixtures.documentContract.customerId, {
        title: documentFixtures.documentContract.title,
        type: documentFixtures.documentContract.type,
        fileStream,
        originalFileName: 'contract.pdf',
      });

      expect(result.id).toBeDefined();
      const savedFiles = await fs.readdir(uploadDir);
      expect(savedFiles).toContain(result.filePath);
    });
  });
});

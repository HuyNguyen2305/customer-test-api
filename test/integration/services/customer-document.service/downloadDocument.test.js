import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import fixtures from '../../../fixtures/customer-portal.fixtures.cjs';

const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'customer-document-service-download-'));
process.env.UPLOAD_DIR = uploadDir;

const { default: CustomerDocumentService } = await import('#service/customer-document.service.js');
const { default: CustomerDocumentRepository } = await import('#repositories/customer-document.repository.js');
const { NotFoundError } = await import('#configs/error.js');
const models = (await import('#models/index.js')).default;

const {
  customerA,
  customerB,
  service1,
  bookingA,
  bookingB,
  serviceDocLibraryA,
  pdfA,
  customerDocumentA,
  customerDocumentB,
} = fixtures;

function buildService() {
  const customerDocumentRepository = Object.create(CustomerDocumentRepository.prototype);
  customerDocumentRepository.model = models.CustomerDocument;
  customerDocumentRepository.serviceDocumentLibraryModel = models.ServiceDocumentLibrary;
  customerDocumentRepository.pdfModel = models.Pdf;
  const service = Object.create(CustomerDocumentService.prototype);
  service.customerDocumentRepository = customerDocumentRepository;
  return service;
}

const baseFixtures = {
  Customer: [customerA, customerB],
  Service: [service1],
  Booking: [bookingA, bookingB],
  ServiceDocumentLibrary: [serviceDocLibraryA],
  Pdf: [pdfA],
  CustomerDocument: [customerDocumentA, customerDocumentB],
};

describe('CustomerDocumentService.downloadDocument (integration)', () => {
  afterAll(() => fs.rm(uploadDir, { recursive: true, force: true }));

  // Runs before the "exists on disk" tests below write their files into uploadDir.
  it('throws NotFoundError when the record exists but the file is missing from disk', async () => {
    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      await expect(service.downloadDocument(customerDocumentA.id, customerA.id)).rejects.toThrow(NotFoundError);
    });
  });

  it("throws NotFoundError when requesting another customer's document", async () => {
    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      await expect(service.downloadDocument(customerDocumentB.id, customerA.id)).rejects.toThrow(NotFoundError);
    });
  });

  it('returns the library file and absolute path for a "doc" type document when the file exists on disk', async () => {
    await fs.writeFile(path.join(uploadDir, serviceDocLibraryA.filePath), 'agreement contents');

    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      const result = await service.downloadDocument(customerDocumentA.id, customerA.id);

      expect(result.file.originalFileName).toBe(serviceDocLibraryA.originalFileName);
      expect(result.absolutePath).toBe(path.join(uploadDir, serviceDocLibraryA.filePath));
    });
  });

  it('returns the pdf file and absolute path for a "pdf" type document when the file exists on disk', async () => {
    await fs.writeFile(path.join(uploadDir, pdfA.filePath), 'report contents');

    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      const result = await service.downloadDocument(customerDocumentB.id, customerB.id);

      expect(result.file.originalFileName).toBe(pdfA.originalFileName);
      expect(result.absolutePath).toBe(path.join(uploadDir, pdfA.filePath));
    });
  });
});

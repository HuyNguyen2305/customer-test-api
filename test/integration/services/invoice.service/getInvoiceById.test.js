import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import invoiceFixtures from '../../../fixtures/invoice.fixtures.cjs';

const { default: InvoiceService } = await import('#service/invoice.service.js');
const { default: InvoiceRepository } = await import('#repositories/invoice.repository.js');
const { NotFoundError } = await import('#configs/error.js');
const models = (await import('#models/index.js')).default;

function buildService() {
  const invoiceRepository = Object.create(InvoiceRepository.prototype);
  invoiceRepository.model = models.Invoice;
  const service = Object.create(InvoiceService.prototype);
  service.invoiceRepository = invoiceRepository;
  return service;
}

describe('InvoiceService.getInvoiceById (integration)', () => {
  it('returns the persisted invoice for the customer', async () => {
    await seedWithTransaction({ Invoice: [invoiceFixtures.invoiceOpen] }, async ({ seeded }) => {
      const service = buildService();
      const seededInvoice = seeded.Invoice[0];

      const result = await service.getInvoiceById(seededInvoice.id, invoiceFixtures.invoiceOpen.customerId);

      expect(result.invoiceNumber).toBe(invoiceFixtures.invoiceOpen.invoiceNumber);
    });
  });

  it('throws NotFoundError when the invoice does not belong to the customer', async () => {
    await seedWithTransaction({ Invoice: [invoiceFixtures.invoiceOpen] }, async ({ seeded }) => {
      const service = buildService();
      const seededInvoice = seeded.Invoice[0];

      await expect(
        service.getInvoiceById(seededInvoice.id, invoiceFixtures.invoiceOtherCustomer.customerId),
      ).rejects.toThrow(NotFoundError);
    });
  });
});

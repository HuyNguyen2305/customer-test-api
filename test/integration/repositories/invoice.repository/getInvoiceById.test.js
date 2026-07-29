import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import invoiceFixtures from '../../../fixtures/invoice.fixtures.cjs';

const { default: InvoiceRepository } = await import('#repositories/invoice.repository.js');
const models = (await import('#models/index.js')).default;

describe('InvoiceRepository.getInvoiceById (integration)', () => {
  it('reads back the seeded invoice row scoped to the customer', async () => {
    await seedWithTransaction({ Invoice: [invoiceFixtures.invoiceOpen] }, async ({ seeded }) => {
      const repository = Object.create(InvoiceRepository.prototype);
      repository.model = models.Invoice;
      const seededInvoice = seeded.Invoice[0];

      const result = await repository.getInvoiceById(seededInvoice.id, invoiceFixtures.invoiceOpen.customerId);

      expect(result).not.toBeNull();
      expect(result.invoiceNumber).toBe(invoiceFixtures.invoiceOpen.invoiceNumber);
    });
  });

  it('returns null when the invoice belongs to a different customer', async () => {
    await seedWithTransaction({ Invoice: [invoiceFixtures.invoiceOpen] }, async ({ seeded }) => {
      const repository = Object.create(InvoiceRepository.prototype);
      repository.model = models.Invoice;
      const seededInvoice = seeded.Invoice[0];

      const result = await repository.getInvoiceById(seededInvoice.id, invoiceFixtures.invoiceOtherCustomer.customerId);

      expect(result).toBeNull();
    });
  });
});

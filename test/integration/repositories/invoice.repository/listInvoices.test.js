import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import invoiceFixtures from '../../../fixtures/invoice.fixtures.cjs';

const { default: InvoiceRepository } = await import('#repositories/invoice.repository.js');
const models = (await import('#models/index.js')).default;

describe('InvoiceRepository.listInvoices (integration)', () => {
  it('returns only the invoices for the given customer, newest issueDate first', async () => {
    await seedWithTransaction(
      { Invoice: [invoiceFixtures.invoiceOpen, invoiceFixtures.invoicePaid, invoiceFixtures.invoiceOtherCustomer] },
      async () => {
        const repository = Object.create(InvoiceRepository.prototype);
        repository.model = models.Invoice;

        const result = await repository.listInvoices(invoiceFixtures.invoiceOpen.customerId, {
          limit: 20,
          offset: 0,
        });

        expect(result.count).toBe(2);
        expect(result.rows.map((row) => row.invoiceNumber)).toEqual([
          invoiceFixtures.invoiceOpen.invoiceNumber,
          invoiceFixtures.invoicePaid.invoiceNumber,
        ]);
      },
    );
  });

  it('filters by status when provided', async () => {
    await seedWithTransaction({ Invoice: [invoiceFixtures.invoiceOpen, invoiceFixtures.invoicePaid] }, async () => {
      const repository = Object.create(InvoiceRepository.prototype);
      repository.model = models.Invoice;

      const result = await repository.listInvoices(invoiceFixtures.invoiceOpen.customerId, {
        status: 'paid',
        limit: 20,
        offset: 0,
      });

      expect(result.count).toBe(1);
      expect(result.rows[0].invoiceNumber).toBe(invoiceFixtures.invoicePaid.invoiceNumber);
    });
  });
});

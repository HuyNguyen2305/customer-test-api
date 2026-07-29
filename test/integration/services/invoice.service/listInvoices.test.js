import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import invoiceFixtures from '../../../fixtures/invoice.fixtures.cjs';

const { default: InvoiceService } = await import('#service/invoice.service.js');
const { default: InvoiceRepository } = await import('#repositories/invoice.repository.js');
const models = (await import('#models/index.js')).default;

function buildService() {
  const invoiceRepository = Object.create(InvoiceRepository.prototype);
  invoiceRepository.model = models.Invoice;
  const service = Object.create(InvoiceService.prototype);
  service.invoiceRepository = invoiceRepository;
  return service;
}

describe('InvoiceService.listInvoices (integration)', () => {
  it('returns the paginated invoices for the customer', async () => {
    await seedWithTransaction(
      { Invoice: [invoiceFixtures.invoiceOpen, invoiceFixtures.invoicePaid, invoiceFixtures.invoiceOtherCustomer] },
      async () => {
        const service = buildService();

        const result = await service.listInvoices(invoiceFixtures.invoiceOpen.customerId, { page: 1, pageSize: 10 });

        expect(result.invoices).toHaveLength(2);
        expect(result.pagination).toEqual({ page: 1, pageSize: 10, total: 2, totalPages: 1 });
      },
    );
  });
});

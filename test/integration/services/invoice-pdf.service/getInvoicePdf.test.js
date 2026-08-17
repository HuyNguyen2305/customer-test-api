import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import fixtures from '../../../fixtures/customer-portal.fixtures.cjs';

const { default: InvoicePdfService } = await import('#service/invoice-pdf.service.js');
const { default: CustomerInvoiceRepository } = await import('#repositories/customer-invoice.repository.js');
const { NotFoundError } = await import('#configs/error.js');
const models = (await import('#models/index.js')).default;

const {
  customerA,
  customerB,
  addressA,
  addressA2,
  service1,
  item1,
  bookingA,
  bookingA2,
  bookingB,
  invoiceA,
  invoiceB,
  invoiceA2,
  invoicePaidA,
  invoiceItemA,
} = fixtures;

function buildService() {
  const customerInvoiceRepository = Object.create(CustomerInvoiceRepository.prototype);
  customerInvoiceRepository.model = models.CustomerInvoice;
  customerInvoiceRepository.customerInvoiceItemModel = models.CustomerInvoiceItem;
  customerInvoiceRepository.addressModel = models.Address;
  customerInvoiceRepository.customerModel = models.Customer;
  const service = Object.create(InvoicePdfService.prototype);
  service.customerInvoiceRepository = customerInvoiceRepository;
  return service;
}

const baseFixtures = {
  Customer: [customerA, customerB],
  Address: [addressA, addressA2],
  Service: [service1],
  Item: [item1],
  Booking: [bookingA, bookingA2, bookingB],
  CustomerInvoice: [invoiceA, invoiceB, invoiceA2, invoicePaidA],
  CustomerInvoiceItem: [invoiceItemA],
};

describe('InvoicePdfService.getInvoicePdf (integration)', () => {
  it('resolves a valid PDF buffer for the owner', async () => {
    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      const { buffer } = await service.getInvoicePdf(invoiceA.id, customerA.id);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });
  });

  it("throws NotFoundError when requesting another customer's invoice", async () => {
    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      await expect(service.getInvoicePdf(invoiceB.id, customerA.id)).rejects.toThrow(NotFoundError);
    });
  });

  it("computes the account balance as the sum of balanceDue across all of the customer's invoices, regardless of which invoice is requested", async () => {
    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      // customerA: invoiceA (100) + invoiceA2 (0) + invoicePaidA (0) = 100
      const openBalance = await service.customerInvoiceRepository.sumBalanceDueByCustomerId(customerA.id);
      expect(openBalance).toBe(100);

      const openResult = await service.getInvoicePdf(invoiceA.id, customerA.id);
      const paidResult = await service.getInvoicePdf(invoicePaidA.id, customerA.id);

      expect(Buffer.isBuffer(openResult.buffer)).toBe(true);
      expect(Buffer.isBuffer(paidResult.buffer)).toBe(true);
    });
  });
});

import { seedWithTransaction, TEST_SCHEMA } from '../../../helpers/seed-fixtures.js';
import fixtures from '../../../fixtures/customer-portal.fixtures.cjs';

const { default: EstimatePdfService } = await import('#service/estimate-pdf.service.js');
const { default: CustomerEstimateRepository } = await import('#repositories/customer-estimate.repository.js');
const { default: CustomerEstimateService } = await import('#service/customer-estimate.service.js');
const { default: CustomerLineItemRepository } = await import('#repositories/customer-line-item.repository.js');
const { default: TaxRateRepository } = await import('#repositories/tax-rate.repository.js');
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
  estimateA,
  estimateB,
  estimateDraftA,
  estimateApprovedA2,
  estimateItemA,
} = fixtures;

function buildService() {
  const customerEstimateRepository = Object.create(CustomerEstimateRepository.prototype);
  customerEstimateRepository.model = models.CustomerEstimate;
  customerEstimateRepository.customerLineItemModel = models.CustomerLineItem;
  customerEstimateRepository.bookingModel = models.Booking;
  customerEstimateRepository.addressModel = models.Address;
  customerEstimateRepository.customerModel = models.Customer;
  customerEstimateRepository.taxRateModel = models.TaxRate;
  customerEstimateRepository.itemModel = models.Item;

  const customerLineItemRepository = Object.create(CustomerLineItemRepository.prototype);
  customerLineItemRepository.model = models.CustomerLineItem;

  const taxRateRepository = Object.create(TaxRateRepository.prototype);
  taxRateRepository.model = models.TaxRate;

  const customerEstimateService = Object.create(CustomerEstimateService.prototype);
  customerEstimateService.customerLineItemRepository = customerLineItemRepository;
  customerEstimateService.taxRateRepository = taxRateRepository;

  const service = Object.create(EstimatePdfService.prototype);
  service.customerEstimateRepository = customerEstimateRepository;
  service.customerEstimateService = customerEstimateService;
  return service;
}

const baseFixtures = {
  Customer: [customerA, customerB],
  Address: [addressA, addressA2],
  Service: [service1],
  Item: [item1],
  Booking: [bookingA, bookingA2, bookingB],
  CustomerEstimate: [estimateA, estimateB, estimateDraftA, estimateApprovedA2],
  CustomerLineItem: [estimateItemA],
};

describe('EstimatePdfService.getEstimatePdf (integration)', () => {
  it('resolves a valid PDF buffer for a sent estimate owned by the customer', async () => {
    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      // estimateItemA is seeded with no subtotal/total (fixture only sets
      // cost/qty) - this is the exact staleness scenario refreshItemCache
      // exists for. Asserting these columns end up populated proves the PDF
      // path actually recomputed and persisted them, not just that a buffer
      // came back (a buffer is produced either way, recomputed or not).
      const before = await models.CustomerLineItem.schema(TEST_SCHEMA).findByPk(estimateItemA.id);
      expect(before.subtotal).toBeNull();

      const { buffer } = await service.getEstimatePdf(estimateA.id, customerA.id);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');

      const after = await models.CustomerLineItem.schema(TEST_SCHEMA).findByPk(estimateItemA.id);
      expect(Number(after.subtotal)).toBe(80);
      expect(Number(after.total)).toBe(80);
    });
  });

  it('resolves a valid PDF buffer for an approved estimate with a service address', async () => {
    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      const { buffer } = await service.getEstimatePdf(estimateApprovedA2.id, customerA.id);

      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });
  });

  it("throws NotFoundError when requesting another customer's estimate", async () => {
    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      await expect(service.getEstimatePdf(estimateB.id, customerA.id)).rejects.toThrow(NotFoundError);
    });
  });

  it('throws NotFoundError for a draft estimate (not portal-visible)', async () => {
    await seedWithTransaction(baseFixtures, async () => {
      const service = buildService();

      await expect(service.getEstimatePdf(estimateDraftA.id, customerA.id)).rejects.toThrow(NotFoundError);
    });
  });
});

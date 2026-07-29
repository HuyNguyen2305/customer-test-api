import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import estimateFixtures from '../../../fixtures/estimate.fixtures.cjs';

const { default: EstimateService } = await import('#service/estimate.service.js');
const { default: EstimateRepository } = await import('#repositories/estimate.repository.js');
const { NotFoundError } = await import('#configs/error.js');
const models = (await import('#models/index.js')).default;

function buildService() {
  const estimateRepository = Object.create(EstimateRepository.prototype);
  estimateRepository.model = models.Estimate;
  const service = Object.create(EstimateService.prototype);
  service.estimateRepository = estimateRepository;
  return service;
}

describe('EstimateService.getEstimateById (integration)', () => {
  it('returns the persisted estimate for the customer', async () => {
    await seedWithTransaction({ Estimate: [estimateFixtures.estimateDraft] }, async ({ seeded }) => {
      const service = buildService();
      const seededEstimate = seeded.Estimate[0];

      const result = await service.getEstimateById(seededEstimate.id, estimateFixtures.estimateDraft.customerId);

      expect(Number(result.amount)).toBe(estimateFixtures.estimateDraft.amount);
    });
  });

  it('throws NotFoundError when the estimate does not belong to the customer', async () => {
    await seedWithTransaction({ Estimate: [estimateFixtures.estimateDraft] }, async ({ seeded }) => {
      const service = buildService();
      const seededEstimate = seeded.Estimate[0];

      await expect(
        service.getEstimateById(seededEstimate.id, estimateFixtures.estimateOtherCustomer.customerId),
      ).rejects.toThrow(NotFoundError);
    });
  });
});

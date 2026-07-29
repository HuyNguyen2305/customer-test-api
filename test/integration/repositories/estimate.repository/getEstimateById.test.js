import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import estimateFixtures from '../../../fixtures/estimate.fixtures.cjs';

const { default: EstimateRepository } = await import('#repositories/estimate.repository.js');
const models = (await import('#models/index.js')).default;

describe('EstimateRepository.getEstimateById (integration)', () => {
  it('reads back the seeded estimate row scoped to the customer', async () => {
    await seedWithTransaction({ Estimate: [estimateFixtures.estimateDraft] }, async ({ seeded }) => {
      const repository = Object.create(EstimateRepository.prototype);
      repository.model = models.Estimate;
      const seededEstimate = seeded.Estimate[0];

      const result = await repository.getEstimateById(seededEstimate.id, estimateFixtures.estimateDraft.customerId);

      expect(result).not.toBeNull();
      expect(Number(result.amount)).toBe(estimateFixtures.estimateDraft.amount);
    });
  });

  it('returns null when the estimate belongs to a different customer', async () => {
    await seedWithTransaction({ Estimate: [estimateFixtures.estimateDraft] }, async ({ seeded }) => {
      const repository = Object.create(EstimateRepository.prototype);
      repository.model = models.Estimate;
      const seededEstimate = seeded.Estimate[0];

      const result = await repository.getEstimateById(
        seededEstimate.id,
        estimateFixtures.estimateOtherCustomer.customerId,
      );

      expect(result).toBeNull();
    });
  });
});

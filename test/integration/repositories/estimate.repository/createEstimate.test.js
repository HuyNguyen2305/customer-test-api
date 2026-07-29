import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import estimateFixtures from '../../../fixtures/estimate.fixtures.cjs';

const { default: EstimateRepository } = await import('#repositories/estimate.repository.js');
const models = (await import('#models/index.js')).default;

describe('EstimateRepository.createEstimate (integration)', () => {
  it('persists a new estimate row', async () => {
    await seedWithTransaction({ Estimate: [] }, async () => {
      const repository = Object.create(EstimateRepository.prototype);
      repository.model = models.Estimate;

      const created = await repository.createEstimate({ ...estimateFixtures.estimateDraft });

      expect(created.id).toBeDefined();
      const found = await repository.getEstimateById(created.id, estimateFixtures.estimateDraft.customerId);
      expect(found).not.toBeNull();
      expect(found.status).toBe('draft');
    });
  });
});

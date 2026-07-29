import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import estimateFixtures from '../../../fixtures/estimate.fixtures.cjs';

const { default: EstimateService } = await import('#service/estimate.service.js');
const { default: EstimateRepository } = await import('#repositories/estimate.repository.js');
const models = (await import('#models/index.js')).default;

function buildService() {
  const estimateRepository = Object.create(EstimateRepository.prototype);
  estimateRepository.model = models.Estimate;
  const service = Object.create(EstimateService.prototype);
  service.estimateRepository = estimateRepository;
  return service;
}

describe('EstimateService.createEstimate (integration)', () => {
  it('persists a new estimate for the customer', async () => {
    await seedWithTransaction({ Estimate: [] }, async () => {
      const service = buildService();

      const result = await service.createEstimate(estimateFixtures.estimateDraft.customerId, {
        amount: estimateFixtures.estimateDraft.amount,
        description: estimateFixtures.estimateDraft.description,
        validUntil: estimateFixtures.estimateDraft.validUntil,
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe('draft');
    });
  });
});

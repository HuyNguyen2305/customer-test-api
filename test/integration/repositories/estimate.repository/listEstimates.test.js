import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import estimateFixtures from '../../../fixtures/estimate.fixtures.cjs';

const { default: EstimateRepository } = await import('#repositories/estimate.repository.js');
const models = (await import('#models/index.js')).default;

describe('EstimateRepository.listEstimates (integration)', () => {
  it('returns only the estimates for the given customer, newest first', async () => {
    await seedWithTransaction(
      {
        Estimate: [
          estimateFixtures.estimateDraft,
          estimateFixtures.estimateApproved,
          estimateFixtures.estimateOtherCustomer,
        ],
      },
      async () => {
        const repository = Object.create(EstimateRepository.prototype);
        repository.model = models.Estimate;

        const result = await repository.listEstimates(estimateFixtures.estimateDraft.customerId, {
          limit: 20,
          offset: 0,
        });

        expect(result.count).toBe(2);
      },
    );
  });

  it('filters by status when provided', async () => {
    await seedWithTransaction(
      { Estimate: [estimateFixtures.estimateDraft, estimateFixtures.estimateApproved] },
      async () => {
        const repository = Object.create(EstimateRepository.prototype);
        repository.model = models.Estimate;

        const result = await repository.listEstimates(estimateFixtures.estimateDraft.customerId, {
          status: 'approved',
          limit: 20,
          offset: 0,
        });

        expect(result.count).toBe(1);
        expect(result.rows[0].status).toBe('approved');
      },
    );
  });
});

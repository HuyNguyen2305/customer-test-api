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

describe('EstimateService.listEstimates (integration)', () => {
  it('returns the paginated estimates for the customer', async () => {
    await seedWithTransaction(
      {
        Estimate: [
          estimateFixtures.estimateDraft,
          estimateFixtures.estimateApproved,
          estimateFixtures.estimateOtherCustomer,
        ],
      },
      async () => {
        const service = buildService();

        const result = await service.listEstimates(estimateFixtures.estimateDraft.customerId, {
          page: 1,
          pageSize: 10,
        });

        expect(result.estimates).toHaveLength(2);
        expect(result.pagination).toEqual({ page: 1, pageSize: 10, total: 2, totalPages: 1 });
      },
    );
  });
});

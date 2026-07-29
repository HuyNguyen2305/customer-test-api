import { jest } from '@jest/globals';

const { default: EstimateService } = await import('#service/estimate.service.js');

describe('EstimateService.listEstimates', () => {
  it('paginates using default page/pageSize and shapes the result', async () => {
    const rows = [{ id: 'e1' }, { id: 'e2' }];
    const service = Object.create(EstimateService.prototype);
    service.estimateRepository = { listEstimates: jest.fn().mockResolvedValue({ rows, count: 2 }) };

    const result = await service.listEstimates('c1');

    expect(service.estimateRepository.listEstimates).toHaveBeenCalledWith('c1', {
      status: undefined,
      limit: 20,
      offset: 0,
    });
    expect(result).toEqual({
      estimates: rows,
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
  });

  it('computes offset and totalPages for a later page and forwards the status filter', async () => {
    const service = Object.create(EstimateService.prototype);
    service.estimateRepository = { listEstimates: jest.fn().mockResolvedValue({ rows: [], count: 45 }) };

    const result = await service.listEstimates('c1', { page: 3, pageSize: 10, status: 'sent' });

    expect(service.estimateRepository.listEstimates).toHaveBeenCalledWith('c1', {
      status: 'sent',
      limit: 10,
      offset: 20,
    });
    expect(result.pagination).toEqual({ page: 3, pageSize: 10, total: 45, totalPages: 5 });
  });
});

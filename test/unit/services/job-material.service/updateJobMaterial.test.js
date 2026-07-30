import { jest } from '@jest/globals';

const { default: JobMaterialService } = await import('#service/job-material.service.js');
const { NotFoundError } = await import('#configs/error.js');

function buildService({ affectedCount = 1, updated } = {}) {
  const service = Object.create(JobMaterialService.prototype);
  service.jobMaterialRepository = {
    updateOne: jest.fn().mockResolvedValue([affectedCount]),
    findByPk: jest.fn().mockResolvedValue(updated),
  };
  return service;
}

describe('JobMaterialService.updateJobMaterial', () => {
  it('delegates to the repository, which forces isCustomized true, and returns the updated row', async () => {
    const updated = { id: 'jm1', isCustomized: true };
    const service = buildService({ updated });

    const result = await service.updateJobMaterial('jm1', { unitsValue: 10 });

    expect(service.jobMaterialRepository.updateOne).toHaveBeenCalledWith('jm1', { unitsValue: 10 });
    expect(result).toBe(updated);
  });

  it('throws NotFoundError when no row was affected', async () => {
    const service = buildService({ affectedCount: 0 });

    await expect(service.updateJobMaterial('missing', { unitsValue: 10 })).rejects.toThrow(NotFoundError);
  });
});

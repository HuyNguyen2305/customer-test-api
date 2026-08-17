import { jest } from '@jest/globals';

const { default: JobTodoService } = await import('#service/job-todo.service.js');
const { NotFoundError } = await import('#configs/error.js');

function buildService({ affectedCount = 1, updated } = {}) {
  const service = Object.create(JobTodoService.prototype);
  service.todoRepository = {
    updateOne: jest.fn().mockResolvedValue([affectedCount]),
    findByPk: jest.fn().mockResolvedValue(updated),
  };
  return service;
}

describe('JobTodoService.updateJobTodo', () => {
  it('delegates to the repository, which forces isCustomized true, and returns the updated row', async () => {
    const updated = { id: 'jt1', isCustomized: true };
    const service = buildService({ updated });

    const result = await service.updateJobTodo('jt1', { text: 'New text' });

    expect(service.todoRepository.updateOne).toHaveBeenCalledWith('jt1', { text: 'New text' });
    expect(result).toBe(updated);
  });

  it('throws NotFoundError when no row was affected', async () => {
    const service = buildService({ affectedCount: 0 });

    await expect(service.updateJobTodo('missing', { text: 'x' })).rejects.toThrow(NotFoundError);
  });
});

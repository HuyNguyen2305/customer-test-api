import { jest } from '@jest/globals';

const { default: TodoRepository } = await import('#repositories/todo.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('TodoRepository.updateOne', () => {
  it('forces isCustomized to true on any manual update', async () => {
    const scopedModel = { update: jest.fn().mockResolvedValue([1]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(TodoRepository.prototype);
    repository.model = model;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateOne('jt1', { text: 'New text' }),
    );

    expect(scopedModel.update).toHaveBeenCalledWith({ text: 'New text', isCustomized: true }, { where: { id: 'jt1' } });
  });
});

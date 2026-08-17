import { jest } from '@jest/globals';

const { default: TodoListRepository } = await import('#repositories/todo-list.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('TodoListRepository.deleteByBookingId', () => {
  it('deletes only bookingId-owned rows, scoped to the tenant schema - never matches a serviceId-owned template row', async () => {
    const scopedModel = { destroy: jest.fn().mockResolvedValue(2) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(TodoListRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.deleteByBookingId('b1'),
    );

    expect(scopedModel.destroy).toHaveBeenCalledWith({ where: { bookingId: 'b1' } });
    expect(result).toBe(2);
  });
});

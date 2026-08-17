import { jest } from '@jest/globals';

const { default: TodoListRepository } = await import('#repositories/todo-list.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('TodoListRepository.findByBookingId', () => {
  it('queries bookingId-owned TodoList rows with their Todo items eager-loaded, scoped to the tenant schema', async () => {
    const rows = [{ id: 'jtl1', bookingId: 'b1' }];
    const scopedModel = { findAll: jest.fn().mockResolvedValue(rows) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const todoModel = {};
    const repository = Object.create(TodoListRepository.prototype);
    repository.model = model;
    repository.todoModel = todoModel;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByBookingId('b1'),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findAll).toHaveBeenCalledWith({
      where: { bookingId: 'b1' },
      include: [{ model: todoModel }],
    });
    expect(result).toBe(rows);
  });
});

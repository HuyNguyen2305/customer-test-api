import { BaseRepository } from '#common/base-repository.js';

class TodoListRepository extends BaseRepository {
  constructor({ todoListModel, todoModel }) {
    super(todoListModel);
    this.todoModel = todoModel;
  }

  findByServiceId(serviceId) {
    return this.findAll({
      where: { serviceId },
      include: [{ model: this.todoModel }],
      order: [['sortOrder', 'ASC']],
    });
  }
}

export default TodoListRepository;

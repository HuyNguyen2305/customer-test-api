import { BaseRepository } from '#common/base-repository.js';

class TodoRepository extends BaseRepository {
  constructor({ todoModel }) {
    super(todoModel);
  }

  updateOne(id, data) {
    return this.update({ ...data, isCustomized: true }, { where: { id } });
  }
}

export default TodoRepository;

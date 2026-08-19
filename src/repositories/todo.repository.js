import { BaseRepository } from '#common/base-repository.js';

class TodoRepository extends BaseRepository {
  constructor({ todoModel }) {
    super(todoModel);
  }
}

export default TodoRepository;

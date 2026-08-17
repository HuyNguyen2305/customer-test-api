import { NotFoundError } from '#configs/error.js';

class JobTodoService {
  constructor({ todoRepository }) {
    this.todoRepository = todoRepository;
  }

  async updateJobTodo(id, data) {
    const [affectedCount] = await this.todoRepository.updateOne(id, data);
    if (!affectedCount) throw new NotFoundError('Job todo not found');
    return this.todoRepository.findByPk(id);
  }
}

export default JobTodoService;

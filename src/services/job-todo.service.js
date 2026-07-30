import { NotFoundError } from '#configs/error.js';

class JobTodoService {
  constructor({ jobTodoRepository }) {
    this.jobTodoRepository = jobTodoRepository;
  }

  async updateJobTodo(id, data) {
    const [affectedCount] = await this.jobTodoRepository.updateOne(id, data);
    if (!affectedCount) throw new NotFoundError('Job todo not found');
    return this.jobTodoRepository.findByPk(id);
  }
}

export default JobTodoService;

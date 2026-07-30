import { BaseRepository } from '#common/base-repository.js';

class JobTodoRepository extends BaseRepository {
  constructor({ jobTodoModel }) {
    super(jobTodoModel);
  }

  updateOne(id, data) {
    return this.update({ ...data, isCustomized: true }, { where: { id } });
  }
}

export default JobTodoRepository;

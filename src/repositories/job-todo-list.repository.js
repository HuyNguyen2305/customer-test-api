import { BaseRepository } from '#common/base-repository.js';

class JobTodoListRepository extends BaseRepository {
  constructor({ jobTodoListModel, jobTodoModel }) {
    super(jobTodoListModel);
    this.jobTodoModel = jobTodoModel;
  }

  findByBookingId(bookingId) {
    return this.findAll({
      where: { bookingId },
      include: [{ model: this.jobTodoModel }],
    });
  }

  deleteByBookingId(bookingId) {
    return this.destroy({ where: { bookingId } });
  }
}

export default JobTodoListRepository;

import { NotFoundError } from '#configs/error.js';

class JobSnapshotService {
  constructor({
    bookingRepository,
    todoListRepository,
    materialRepository,
    jobMaterialRepository,
    jobTodoListRepository,
    jobTodoRepository,
  }) {
    this.bookingRepository = bookingRepository;
    this.todoListRepository = todoListRepository;
    this.materialRepository = materialRepository;
    this.jobMaterialRepository = jobMaterialRepository;
    this.jobTodoListRepository = jobTodoListRepository;
    this.jobTodoRepository = jobTodoRepository;
  }

  async createSnapshotForBooking(bookingId) {
    const booking = await this.bookingRepository.findByPk(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const materials = await this.materialRepository.findByServiceId(booking.serviceId);
    const todoLists = await this.todoListRepository.findByServiceId(booking.serviceId);

    if (materials.length) {
      await this.jobMaterialRepository.bulkCreate(
        materials.map((material) => ({
          bookingId,
          materialId: material.materialId,
          unitsValue: material.unitsValue,
          unitsTypeId: material.unitsTypeId,
          dilution: material.dilution,
          methodId: material.methodId,
          customMaterialId: material.customMaterialId,
          locationId: material.locationId,
          targetPestId: material.targetPestId,
          sortOrder: material.sortOrder,
          isCustomized: false,
        })),
      );
    }

    for (const todoList of todoLists) {
      const jobTodoList = await this.jobTodoListRepository.create({
        bookingId,
        name: todoList.name,
        sortOrder: todoList.sortOrder,
      });

      const todos = todoList.Todos || [];
      if (todos.length) {
        await this.jobTodoRepository.bulkCreate(
          todos.map((todo) => ({
            jobTodoListId: jobTodoList.id,
            text: todo.text,
            sortOrder: todo.sortOrder,
            completed: false,
            isCustomized: false,
          })),
        );
      }
    }
  }
}

export default JobSnapshotService;

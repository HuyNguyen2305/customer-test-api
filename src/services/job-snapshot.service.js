import { NotFoundError } from '#configs/error.js';

class JobSnapshotService {
  constructor({ bookingRepository, todoListRepository, materialRepository, todoRepository }) {
    this.bookingRepository = bookingRepository;
    this.todoListRepository = todoListRepository;
    this.materialRepository = materialRepository;
    this.todoRepository = todoRepository;
  }

  async createSnapshotForBooking(bookingId) {
    const booking = await this.bookingRepository.findByPk(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const materials = await this.materialRepository.findByServiceId(booking.serviceId);
    const todoLists = await this.todoListRepository.findByServiceId(booking.serviceId);

    if (materials.length) {
      await this.materialRepository.bulkCreate(
        materials.map((material) => ({
          bookingId,
          materialId: material.materialId,
          unitsValue: material.unitsValue,
          unitsTypeId: material.unitsTypeId,
          dilution: material.dilution,
          methodId: material.methodId,
          locationId: material.locationId,
          targetPestId: material.targetPestId,
          sortOrder: material.sortOrder,
          isCustomized: false,
        })),
      );
    }

    for (const todoList of todoLists) {
      const jobTodoList = await this.todoListRepository.create({
        bookingId,
        name: todoList.name,
        sortOrder: todoList.sortOrder,
      });

      const todos = todoList.Todos || [];
      if (todos.length) {
        await this.todoRepository.bulkCreate(
          todos.map((todo) => ({
            todoListId: jobTodoList.id,
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

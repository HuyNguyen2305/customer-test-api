class JobSyncService {
  constructor({ bookingRepository, materialRepository, todoListRepository, todoRepository }) {
    this.bookingRepository = bookingRepository;
    this.materialRepository = materialRepository;
    this.todoListRepository = todoListRepository;
    this.todoRepository = todoRepository;
  }

  async syncActiveJobs() {
    const bookings = await this.bookingRepository.findActiveBookings();
    const updated = [];
    const skipped = [];

    for (const booking of bookings) {
      const [jobMaterials, jobTodoLists, materials, todoLists] = await Promise.all([
        this.materialRepository.findByBookingId(booking.id),
        this.todoListRepository.findByBookingId(booking.id),
        this.materialRepository.findByServiceId(booking.serviceId),
        this.todoListRepository.findByServiceId(booking.serviceId),
      ]);

      const customizedMaterials = jobMaterials.filter((row) => row.isCustomized);
      const jobTodos = jobTodoLists.flatMap((list) => list.Todos || []);
      const customizedTodos = jobTodos.filter((row) => row.isCustomized);

      let bookingTouched = false;
      const bookingSkipped = customizedMaterials.length > 0 || customizedTodos.length > 0;

      if (customizedMaterials.length === 0) {
        await this.materialRepository.deleteByBookingId(booking.id);
        if (materials.length) {
          await this.materialRepository.bulkCreate(
            materials.map((material) => ({
              bookingId: booking.id,
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
        bookingTouched = true;
      }

      if (customizedTodos.length === 0) {
        await this.todoListRepository.deleteByBookingId(booking.id);
        for (const todoList of todoLists) {
          const jobTodoList = await this.todoListRepository.create({
            bookingId: booking.id,
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
        bookingTouched = true;
      }

      if (bookingTouched) updated.push(booking.id);
      if (bookingSkipped) skipped.push(booking.id);
    }

    return { updated, skipped };
  }
}

export default JobSyncService;

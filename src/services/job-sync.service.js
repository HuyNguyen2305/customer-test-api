class JobSyncService {
  constructor({
    bookingRepository,
    materialRepository,
    todoListRepository,
    jobMaterialRepository,
    jobTodoListRepository,
    jobTodoRepository,
  }) {
    this.bookingRepository = bookingRepository;
    this.materialRepository = materialRepository;
    this.todoListRepository = todoListRepository;
    this.jobMaterialRepository = jobMaterialRepository;
    this.jobTodoListRepository = jobTodoListRepository;
    this.jobTodoRepository = jobTodoRepository;
  }

  async syncActiveJobs() {
    const bookings = await this.bookingRepository.findActiveBookings();
    const updated = [];
    const skipped = [];

    for (const booking of bookings) {
      const [jobMaterials, jobTodoLists, materials, todoLists] = await Promise.all([
        this.jobMaterialRepository.findByBookingId(booking.id),
        this.jobTodoListRepository.findByBookingId(booking.id),
        this.materialRepository.findByServiceId(booking.serviceId),
        this.todoListRepository.findByServiceId(booking.serviceId),
      ]);

      const customizedMaterials = jobMaterials.filter((row) => row.isCustomized);
      const jobTodos = jobTodoLists.flatMap((list) => list.JobTodos || []);
      const customizedTodos = jobTodos.filter((row) => row.isCustomized);

      let bookingTouched = false;
      const bookingSkipped = customizedMaterials.length > 0 || customizedTodos.length > 0;

      if (customizedMaterials.length === 0) {
        await this.jobMaterialRepository.deleteByBookingId(booking.id);
        if (materials.length) {
          await this.jobMaterialRepository.bulkCreate(
            materials.map((material) => ({
              bookingId: booking.id,
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
        bookingTouched = true;
      }

      if (customizedTodos.length === 0) {
        await this.jobTodoListRepository.deleteByBookingId(booking.id);
        for (const todoList of todoLists) {
          const jobTodoList = await this.jobTodoListRepository.create({
            bookingId: booking.id,
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
        bookingTouched = true;
      }

      if (bookingTouched) updated.push(booking.id);
      if (bookingSkipped) skipped.push(booking.id);
    }

    return { updated, skipped };
  }
}

export default JobSyncService;

import { jest } from '@jest/globals';

const { default: JobSnapshotService } = await import('#service/job-snapshot.service.js');
const { NotFoundError } = await import('#configs/error.js');

function buildService({ booking, materials = [], todoLists = [] } = {}) {
  const service = Object.create(JobSnapshotService.prototype);
  service.bookingRepository = { findByPk: jest.fn().mockResolvedValue(booking) };
  service.materialRepository = {
    findByServiceId: jest.fn().mockResolvedValue(materials),
    bulkCreate: jest.fn().mockResolvedValue(undefined),
  };
  service.todoListRepository = { findByServiceId: jest.fn().mockResolvedValue(todoLists), create: jest.fn() };
  service.todoRepository = { bulkCreate: jest.fn().mockResolvedValue(undefined) };
  return service;
}

describe('JobSnapshotService.createSnapshotForBooking', () => {
  it('throws NotFoundError when the booking does not exist', async () => {
    const service = buildService({ booking: null });

    await expect(service.createSnapshotForBooking('missing')).rejects.toThrow(NotFoundError);
  });

  it('copies current service materials into job_materials with isCustomized false', async () => {
    const booking = { id: 'b1', serviceId: 's1' };
    const materials = [
      {
        materialId: 'm1',
        unitsValue: 5,
        unitsTypeId: 'u1',
        dilution: '1:10',
        methodId: 'meth1',
        locationId: 'loc1',
        targetPestId: 'pest1',
        sortOrder: 0,
      },
    ];
    const service = buildService({ booking, materials });

    await service.createSnapshotForBooking('b1');

    expect(service.materialRepository.bulkCreate).toHaveBeenCalledWith([
      {
        bookingId: 'b1',
        materialId: 'm1',
        unitsValue: 5,
        unitsTypeId: 'u1',
        dilution: '1:10',
        methodId: 'meth1',
        locationId: 'loc1',
        targetPestId: 'pest1',
        sortOrder: 0,
        isCustomized: false,
      },
    ]);
  });

  it('copies current service todo lists and todos into bookingId-owned TodoList/Todo rows with isCustomized false', async () => {
    const booking = { id: 'b1', serviceId: 's1' };
    const jobTodoList = { id: 'jtl1' };
    const todoLists = [{ name: 'Prep', sortOrder: 0, Todos: [{ text: 'Check equipment', sortOrder: 0 }] }];
    const service = buildService({ booking, todoLists });
    service.todoListRepository.create.mockResolvedValue(jobTodoList);

    await service.createSnapshotForBooking('b1');

    expect(service.todoListRepository.create).toHaveBeenCalledWith({ bookingId: 'b1', name: 'Prep', sortOrder: 0 });
    expect(service.todoRepository.bulkCreate).toHaveBeenCalledWith([
      { todoListId: 'jtl1', text: 'Check equipment', sortOrder: 0, completed: false, isCustomized: false },
    ]);
  });
});

import { jest } from '@jest/globals';

const { default: JobSyncService } = await import('#service/job-sync.service.js');

function buildService({
  bookings = [],
  jobMaterialsByBooking = {},
  jobTodoListsByBooking = {},
  materialsByService = {},
  todoListsByService = {},
} = {}) {
  const service = Object.create(JobSyncService.prototype);
  service.bookingRepository = { findActiveBookings: jest.fn().mockResolvedValue(bookings) };
  service.jobMaterialRepository = {
    findByBookingId: jest.fn((id) => Promise.resolve(jobMaterialsByBooking[id] || [])),
    deleteByBookingId: jest.fn().mockResolvedValue(undefined),
    bulkCreate: jest.fn().mockResolvedValue(undefined),
  };
  service.todoListRepository = {
    findByBookingId: jest.fn((id) => Promise.resolve(jobTodoListsByBooking[id] || [])),
    deleteByBookingId: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ id: 'new-jtl' }),
    findByServiceId: jest.fn((id) => Promise.resolve(todoListsByService[id] || [])),
  };
  service.todoRepository = { bulkCreate: jest.fn().mockResolvedValue(undefined) };
  service.materialRepository = { findByServiceId: jest.fn((id) => Promise.resolve(materialsByService[id] || [])) };
  return service;
}

describe('JobSyncService.syncActiveJobs', () => {
  it('only considers pending/confirmed bookings via findActiveBookings', async () => {
    const service = buildService({ bookings: [] });

    await service.syncActiveJobs();

    expect(service.bookingRepository.findActiveBookings).toHaveBeenCalled();
  });

  it('overwrites non-customized job_materials rows with the current template and reports the booking as updated', async () => {
    const booking = { id: 'b1', serviceId: 's1' };
    const service = buildService({
      bookings: [booking],
      jobMaterialsByBooking: { b1: [{ id: 'jm1', isCustomized: false }] },
      materialsByService: { s1: [{ materialId: 'm1', unitsValue: 1, sortOrder: 0 }] },
    });

    const result = await service.syncActiveJobs();

    expect(service.jobMaterialRepository.deleteByBookingId).toHaveBeenCalledWith('b1');
    expect(service.jobMaterialRepository.bulkCreate).toHaveBeenCalled();
    expect(result.updated).toContain('b1');
    expect(result.skipped).not.toContain('b1');
  });

  it('leaves customized job_materials rows untouched and reports the booking as skipped', async () => {
    const booking = { id: 'b1', serviceId: 's1' };
    const service = buildService({
      bookings: [booking],
      jobMaterialsByBooking: { b1: [{ id: 'jm1', isCustomized: true }] },
      jobTodoListsByBooking: { b1: [{ id: 'jtl1', Todos: [{ id: 'jt1', isCustomized: true }] }] },
      materialsByService: { s1: [{ materialId: 'm1', unitsValue: 1, sortOrder: 0 }] },
    });

    const result = await service.syncActiveJobs();

    expect(service.jobMaterialRepository.deleteByBookingId).not.toHaveBeenCalled();
    expect(service.jobMaterialRepository.bulkCreate).not.toHaveBeenCalled();
    expect(result.skipped).toContain('b1');
    expect(result.updated).not.toContain('b1');
  });

  it('handles mixed customization: updates job_todos while skipping customized job_materials for the same booking', async () => {
    const booking = { id: 'b1', serviceId: 's1' };
    const service = buildService({
      bookings: [booking],
      jobMaterialsByBooking: { b1: [{ id: 'jm1', isCustomized: true }] },
      jobTodoListsByBooking: { b1: [{ id: 'jtl1', Todos: [{ id: 'jt1', isCustomized: false }] }] },
      todoListsByService: { s1: [{ name: 'Prep', sortOrder: 0, Todos: [] }] },
    });

    const result = await service.syncActiveJobs();

    expect(service.todoListRepository.deleteByBookingId).toHaveBeenCalledWith('b1');
    expect(result.updated).toContain('b1');
    expect(result.skipped).toContain('b1');
  });
});

import { jest } from '@jest/globals';

const { default: ServiceLifecycleService } = await import('#service/service-lifecycle.service.js');
const { BadRequestError, NotFoundError } = await import('#configs/error.js');

function buildService({ service, cancellableBookings = [], refreshed } = {}) {
  const instance = Object.create(ServiceLifecycleService.prototype);
  instance.serviceRepository = {
    findById: jest
      .fn()
      .mockResolvedValueOnce(service)
      .mockResolvedValue(refreshed || service),
    updateStatus: jest.fn().mockResolvedValue(undefined),
  };
  instance.bookingRepository = {
    findFutureCancellableByService: jest.fn().mockResolvedValue(cancellableBookings),
    cancelBookings: jest.fn().mockResolvedValue(undefined),
  };
  return instance;
}

describe('ServiceLifecycleService.archiveOrDeleteService', () => {
  it('throws BadRequestError for an invalid newStatus', async () => {
    const service = buildService({ service: { id: 's1', status: 'active' } });

    await expect(service.archiveOrDeleteService('s1', 'active')).rejects.toThrow(BadRequestError);
    expect(service.serviceRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the service does not exist', async () => {
    const service = buildService({ service: null });

    await expect(service.archiveOrDeleteService('missing', 'archived')).rejects.toThrow(NotFoundError);
  });

  it('sets the service status and cancels only future non-completed/non-cancelled bookings', async () => {
    const cancellableBookings = [{ id: 'b1' }, { id: 'b2' }];
    const service = buildService({ service: { id: 's1', status: 'active' }, cancellableBookings });

    await service.archiveOrDeleteService('s1', 'archived');

    expect(service.serviceRepository.updateStatus).toHaveBeenCalledWith('s1', 'archived');
    expect(service.bookingRepository.findFutureCancellableByService).toHaveBeenCalledWith('s1', expect.any(Date));
    expect(service.bookingRepository.cancelBookings).toHaveBeenCalledWith(['b1', 'b2']);
  });

  it('never touches completed bookings: cancelBookings is skipped when there are none to cancel', async () => {
    const service = buildService({ service: { id: 's1', status: 'active' }, cancellableBookings: [] });

    await service.archiveOrDeleteService('s1', 'deleted');

    expect(service.bookingRepository.cancelBookings).not.toHaveBeenCalled();
  });
});

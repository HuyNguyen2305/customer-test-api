import { BadRequestError, NotFoundError } from '#configs/error.js';

const CASCADE_STATUSES = ['archived', 'deleted'];

class ServiceLifecycleService {
  constructor({ serviceRepository, bookingRepository }) {
    this.serviceRepository = serviceRepository;
    this.bookingRepository = bookingRepository;
  }

  async archiveOrDeleteService(serviceId, newStatus) {
    if (!CASCADE_STATUSES.includes(newStatus)) {
      throw new BadRequestError(`newStatus must be one of: ${CASCADE_STATUSES.join(', ')}`);
    }

    const service = await this.serviceRepository.findById(serviceId);
    if (!service) throw new NotFoundError('Service not found');

    await this.serviceRepository.updateStatus(serviceId, newStatus);

    const cancellableBookings = await this.bookingRepository.findFutureCancellableByService(serviceId, new Date());
    if (cancellableBookings.length) {
      await this.bookingRepository.cancelBookings(cancellableBookings.map((booking) => booking.id));
    }

    return this.serviceRepository.findById(serviceId);
  }
}

export default ServiceLifecycleService;

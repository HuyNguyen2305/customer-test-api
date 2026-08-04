import { NotFoundError } from '#configs/error.js';

function toWorkOrderData(booking) {
  return {
    id: booking.id,
    workOrderNumber: booking.workOrderNumber,
    serviceName: booking.Service?.name ?? null,
    address: booking.Address
      ? {
          id: booking.Address.id,
          label: booking.Address.label,
          line1: booking.Address.line1,
          line2: booking.Address.line2,
          city: booking.Address.city,
          state: booking.Address.state,
          zip: booking.Address.zip,
          country: booking.Address.country,
        }
      : null,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
  };
}

class WorkOrderService {
  constructor({ workOrderRepository }) {
    this.workOrderRepository = workOrderRepository;
  }

  async listWorkOrders(customerId, { page = 1, pageSize = 20, addressId } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.workOrderRepository.listCompletedByCustomerId(customerId, {
      addressId,
      limit: pageSize,
      offset,
    });
    return {
      workOrders: rows.map(toWorkOrderData),
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async getWorkOrderById(id, customerId) {
    const booking = await this.workOrderRepository.findCompletedByIdForCustomer(id, customerId);
    if (!booking) throw new NotFoundError('Work order not found');
    return toWorkOrderData(booking);
  }
}

export default WorkOrderService;

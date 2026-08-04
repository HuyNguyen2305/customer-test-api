import { jest } from '@jest/globals';

const { default: WorkOrderService } = await import('#service/work-order.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('WorkOrderService.getWorkOrderById', () => {
  it('flattens the Service/Address associations for an owned completed booking', async () => {
    const booking = {
      id: 'b1',
      workOrderNumber: 13970,
      startTime: '2026-07-31T10:00:00.000Z',
      endTime: '2026-07-31T11:00:00.000Z',
      status: 'completed',
      Service: { name: 'Initial Service' },
      Address: null,
    };
    const service = Object.create(WorkOrderService.prototype);
    service.workOrderRepository = { findCompletedByIdForCustomer: jest.fn().mockResolvedValue(booking) };

    const result = await service.getWorkOrderById('b1', 'c1');

    expect(service.workOrderRepository.findCompletedByIdForCustomer).toHaveBeenCalledWith('b1', 'c1');
    expect(result).toEqual({
      id: 'b1',
      workOrderNumber: 13970,
      serviceName: 'Initial Service',
      address: null,
      startTime: '2026-07-31T10:00:00.000Z',
      endTime: '2026-07-31T11:00:00.000Z',
      status: 'completed',
    });
  });

  it('throws NotFoundError when no matching completed booking exists for the customer', async () => {
    const service = Object.create(WorkOrderService.prototype);
    service.workOrderRepository = { findCompletedByIdForCustomer: jest.fn().mockResolvedValue(null) };

    await expect(service.getWorkOrderById('missing', 'c1')).rejects.toThrow(NotFoundError);
  });
});

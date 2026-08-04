import { jest } from '@jest/globals';

const { default: WorkOrderService } = await import('#service/work-order.service.js');

describe('WorkOrderService.listWorkOrders', () => {
  it('paginates using default page/pageSize and flattens Service/Address associations', async () => {
    const rows = [
      {
        id: 'b1',
        workOrderNumber: 13970,
        startTime: '2026-07-31T10:00:00.000Z',
        endTime: '2026-07-31T11:00:00.000Z',
        status: 'completed',
        Service: { name: 'Initial Service' },
        Address: {
          id: 'a1',
          label: 'Home',
          line1: '1 Main St',
          line2: null,
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          country: 'US',
        },
      },
      {
        id: 'b2',
        workOrderNumber: 12634,
        startTime: '2026-07-23T07:00:00.000Z',
        endTime: '2026-07-23T08:00:00.000Z',
        status: 'completed',
        Service: null,
        Address: null,
      },
    ];
    const service = Object.create(WorkOrderService.prototype);
    service.workOrderRepository = { listCompletedByCustomerId: jest.fn().mockResolvedValue({ rows, count: 2 }) };

    const result = await service.listWorkOrders('c1');

    expect(service.workOrderRepository.listCompletedByCustomerId).toHaveBeenCalledWith('c1', {
      addressId: undefined,
      limit: 20,
      offset: 0,
    });
    expect(result).toEqual({
      workOrders: [
        {
          id: 'b1',
          workOrderNumber: 13970,
          serviceName: 'Initial Service',
          address: {
            id: 'a1',
            label: 'Home',
            line1: '1 Main St',
            line2: null,
            city: 'Springfield',
            state: 'IL',
            zip: '62701',
            country: 'US',
          },
          startTime: '2026-07-31T10:00:00.000Z',
          endTime: '2026-07-31T11:00:00.000Z',
          status: 'completed',
        },
        {
          id: 'b2',
          workOrderNumber: 12634,
          serviceName: null,
          address: null,
          startTime: '2026-07-23T07:00:00.000Z',
          endTime: '2026-07-23T08:00:00.000Z',
          status: 'completed',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
  });

  it('returns an empty list without error when the customer has no completed bookings', async () => {
    const service = Object.create(WorkOrderService.prototype);
    service.workOrderRepository = { listCompletedByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };

    const result = await service.listWorkOrders('c1');

    expect(result).toEqual({
      workOrders: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
  });

  it('passes addressId through to the repository and computes offset for a later page', async () => {
    const service = Object.create(WorkOrderService.prototype);
    service.workOrderRepository = { listCompletedByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 45 }) };

    const result = await service.listWorkOrders('c1', { page: 3, pageSize: 10, addressId: 'a1' });

    expect(service.workOrderRepository.listCompletedByCustomerId).toHaveBeenCalledWith('c1', {
      addressId: 'a1',
      limit: 10,
      offset: 20,
    });
    expect(result.pagination).toEqual({ page: 3, pageSize: 10, total: 45, totalPages: 5 });
  });
});

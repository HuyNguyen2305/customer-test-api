import { jest } from '@jest/globals';
import { Op } from 'sequelize';

const { default: BookingRepository } = await import('#repositories/booking.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('BookingRepository.cancelBookings', () => {
  it('sets status to cancelled for the given booking ids on the schema-scoped model', async () => {
    const scopedModel = { update: jest.fn().mockResolvedValue([2]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(BookingRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.cancelBookings(['b1', 'b2']),
    );

    expect(scopedModel.update).toHaveBeenCalledWith(
      { status: 'cancelled' },
      { where: { id: { [Op.in]: ['b1', 'b2'] } } },
    );
    expect(result).toEqual([2]);
  });
});

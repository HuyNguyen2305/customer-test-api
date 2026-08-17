import { jest } from '@jest/globals';

const { default: CustomerEstimateRepository } = await import('#repositories/customer-estimate.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerEstimateRepository.findByIdForPdf', () => {
  it('includes items, Booking->Address, and Customer, on top of the same id/customerId scoping as findByIdForCustomer', async () => {
    const estimate = { id: 'e1', customerId: 'c1' };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(estimate) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const scopedItemModel = {};
    const scopedTaxRateModel = {};
    const scopedItemDefModel = {};
    const scopedBookingModel = {};
    const scopedAddressModel = {};
    const scopedCustomerModel = {};
    const customerEstimateItemModel = { schema: jest.fn().mockReturnValue(scopedItemModel) };
    const repository = Object.create(CustomerEstimateRepository.prototype);
    repository.model = model;
    repository.customerEstimateItemModel = customerEstimateItemModel;
    repository.taxRateModel = { schema: jest.fn().mockReturnValue(scopedTaxRateModel) };
    repository.itemModel = { schema: jest.fn().mockReturnValue(scopedItemDefModel) };
    repository.bookingModel = { schema: jest.fn().mockReturnValue(scopedBookingModel) };
    repository.addressModel = { schema: jest.fn().mockReturnValue(scopedAddressModel) };
    repository.customerModel = { schema: jest.fn().mockReturnValue(scopedCustomerModel) };

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByIdForPdf('e1', 'c1'),
    );

    expect(scopedModel.findOne).toHaveBeenCalledWith({
      where: { id: 'e1', customerId: 'c1' },
      attributes: { exclude: ['updatedAt'] },
      include: [
        {
          model: scopedItemModel,
          as: 'items',
          include: [
            { model: scopedTaxRateModel, as: 'Tax1Rate', attributes: ['name', 'rate'] },
            { model: scopedTaxRateModel, as: 'Tax2Rate', attributes: ['name', 'rate'] },
            { model: scopedItemDefModel, attributes: ['name'] },
          ],
        },
        { model: scopedBookingModel, include: [{ model: scopedAddressModel }] },
        { model: scopedCustomerModel, as: 'Customer' },
      ],
    });
    expect(result).toBe(estimate);
  });
});

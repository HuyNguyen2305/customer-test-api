import { jest } from '@jest/globals';

const { default: InvoiceGenerationService } = await import('#service/invoice-generation.service.js');

function buildService({ address = null } = {}) {
  const service = Object.create(InvoiceGenerationService.prototype);
  service.addressRepository = { getByIdForCustomer: jest.fn().mockResolvedValue(address) };
  service.taxRateRepository = { findByState: jest.fn().mockResolvedValue(null) };
  service.customerInvoiceItemRepository = {
    listByInvoiceId: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue(undefined),
  };
  return service;
}

describe('InvoiceGenerationService.buildAddressSnapshot', () => {
  it('returns { addressId: null } without querying when the booking has no addressId', async () => {
    const service = buildService();

    const result = await service.buildAddressSnapshot({ addressId: null, customerId: 'c1' });

    expect(result).toEqual({ addressId: null });
    expect(service.addressRepository.getByIdForCustomer).not.toHaveBeenCalled();
  });

  it('returns { addressId: null } when the address lookup finds nothing', async () => {
    const service = buildService({ address: null });

    const result = await service.buildAddressSnapshot({ addressId: 'a1', customerId: 'c1' });

    expect(result).toEqual({ addressId: null });
  });

  it('returns the addressId alongside a nested addressSnapshot object when the address is found', async () => {
    const address = {
      id: 'a1',
      label: 'Home',
      line1: '123 Main St',
      line2: 'Apt 4',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      country: 'US',
    };
    const service = buildService({ address });

    const result = await service.buildAddressSnapshot({ addressId: 'a1', customerId: 'c1' });

    expect(result).toEqual({
      addressId: 'a1',
      addressSnapshot: {
        addressLabel: 'Home',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4',
        addressCity: 'Springfield',
        addressState: 'IL',
        addressZip: '62701',
        addressCountry: 'US',
      },
    });
  });
});

describe('InvoiceGenerationService.attachAutoTax', () => {
  it('reads the state from the nested addressSnapshot to look up a tax rate', async () => {
    const service = buildService();
    const addressSnapshot = { addressId: 'a1', addressSnapshot: { addressState: 'NY' } };

    await service.attachAutoTax({ id: 'inv1' }, addressSnapshot, {});

    expect(service.taxRateRepository.findByState).toHaveBeenCalledWith('NY');
  });

  it('does nothing when there is no addressSnapshot (no address on the invoice)', async () => {
    const service = buildService();

    await service.attachAutoTax({ id: 'inv1' }, { addressId: null }, {});

    expect(service.taxRateRepository.findByState).not.toHaveBeenCalled();
  });

  it('stamps tax1 from the matched rate while preserving an existing tax2 slot on the item', async () => {
    const taxRate = { id: 'tax-ny', name: 'NY Sales Tax', rate: 4 };
    const service = buildService();
    service.taxRateRepository.findByState = jest.fn().mockResolvedValue(taxRate);
    service.customerInvoiceItemRepository.listByInvoiceId = jest.fn().mockResolvedValue([
      {
        id: 'ii1',
        taxSlots: { tax2RateId: 'tax-local', tax2Name: 'Local Tax', tax2Rate: 1.5 },
      },
    ]);
    const addressSnapshot = { addressId: 'a1', addressSnapshot: { addressState: 'NY' } };

    await service.attachAutoTax({ id: 'inv1' }, addressSnapshot, {});

    expect(service.customerInvoiceItemRepository.updateMany).toHaveBeenCalledWith(
      [
        {
          id: 'ii1',
          taxSlots: {
            tax2RateId: 'tax-local',
            tax2Name: 'Local Tax',
            tax2Rate: 1.5,
            tax1RateId: 'tax-ny',
            tax1Name: 'NY Sales Tax',
            tax1Rate: 4,
          },
        },
      ],
      {},
    );
  });
});

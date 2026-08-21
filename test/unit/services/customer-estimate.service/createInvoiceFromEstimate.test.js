import { jest } from '@jest/globals';

const FAKE_TRANSACTION = { id: 'fake-transaction' };
const transactionMock = jest.fn((fn) => fn(FAKE_TRANSACTION));

jest.unstable_mockModule('#common/sequelize.js', () => ({
  sequelize: { transaction: transactionMock },
}));

const { default: CustomerEstimateService } = await import('#service/customer-estimate.service.js');
const { NotFoundError } = await import('#configs/error.js');

const baseEstimate = {
  id: 'e1',
  bookingId: 'b1',
  customerId: 'c1',
  status: 'sent',
  items: [],
};

function buildService() {
  const service = Object.create(CustomerEstimateService.prototype);
  service.customerLineItemRepository = { updateMany: jest.fn().mockResolvedValue(undefined) };
  return service;
}

describe('CustomerEstimateService.createInvoiceFromEstimate', () => {
  it('delegates to invoiceGenerationService and returns the created invoice DTO', async () => {
    const invoice = { id: 'inv1' };
    const invoiceDto = { id: 'inv1', status: 'draft' };
    const service = buildService();
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(baseEstimate) };
    service.invoiceGenerationService = { generateInvoiceFromEstimate: jest.fn().mockResolvedValue(invoice) };
    service.customerInvoiceService = { getInvoiceById: jest.fn().mockResolvedValue(invoiceDto) };

    const result = await service.createInvoiceFromEstimate('e1', 'c1');

    expect(service.customerEstimateRepository.findByIdForCustomer).toHaveBeenCalledWith('e1', 'c1');
    expect(service.invoiceGenerationService.generateInvoiceFromEstimate).toHaveBeenCalledWith(baseEstimate, 'c1');
    expect(service.customerInvoiceService.getInvoiceById).toHaveBeenCalledWith('inv1', 'c1');
    expect(result).toBe(invoiceDto);
  });

  it('throws NotFoundError when the estimate belongs to another customer', async () => {
    const service = buildService();
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(null) };
    service.invoiceGenerationService = { generateInvoiceFromEstimate: jest.fn() };
    service.customerInvoiceService = { getInvoiceById: jest.fn() };

    await expect(service.createInvoiceFromEstimate('e1', 'someone-else')).rejects.toThrow(NotFoundError);
    expect(service.invoiceGenerationService.generateInvoiceFromEstimate).not.toHaveBeenCalled();
  });

  it.each(['draft', 'declined', 'expired'])(
    'throws NotFoundError when the estimate status is %s (not eligible to invoice)',
    async (status) => {
      const service = buildService();
      service.customerEstimateRepository = {
        findByIdForCustomer: jest.fn().mockResolvedValue({ ...baseEstimate, status }),
      };
      service.invoiceGenerationService = { generateInvoiceFromEstimate: jest.fn() };
      service.customerInvoiceService = { getInvoiceById: jest.fn() };

      await expect(service.createInvoiceFromEstimate('e1', 'c1')).rejects.toThrow(NotFoundError);
      expect(service.invoiceGenerationService.generateInvoiceFromEstimate).not.toHaveBeenCalled();
    },
  );

  it('allows invoicing an already-approved estimate', async () => {
    const invoice = { id: 'inv1' };
    const service = buildService();
    service.customerEstimateRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ ...baseEstimate, status: 'approved' }),
    };
    service.invoiceGenerationService = { generateInvoiceFromEstimate: jest.fn().mockResolvedValue(invoice) };
    service.customerInvoiceService = { getInvoiceById: jest.fn().mockResolvedValue({ id: 'inv1' }) };

    await service.createInvoiceFromEstimate('e1', 'c1');

    expect(service.invoiceGenerationService.generateInvoiceFromEstimate).toHaveBeenCalled();
  });
});

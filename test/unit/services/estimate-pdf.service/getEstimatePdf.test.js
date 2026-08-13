import { jest } from '@jest/globals';

const buildEstimatePdfMock = jest.fn();

jest.unstable_mockModule('#common/pdf/estimate-pdf-builder.js', () => ({
  buildEstimatePdf: buildEstimatePdfMock,
  default: buildEstimatePdfMock,
}));

const { default: EstimatePdfService } = await import('#service/estimate-pdf.service.js');
const { NotFoundError } = await import('#configs/error.js');

const baseEstimate = {
  id: 'e1',
  customerId: 'c1',
  status: 'sent',
  discountValue: 0,
  discountType: 'flat',
  Customer: { id: 'c1', firstName: 'William', lastName: 'Saliba' },
  Booking: { Address: { line1: 'Wall Street' } },
};

describe('EstimatePdfService.getEstimatePdf', () => {
  beforeEach(() => {
    buildEstimatePdfMock.mockReset();
  });

  it('builds the PDF from the estimate, the customer, and the booking address', async () => {
    const buffer = Buffer.from('%PDF-fake');
    buildEstimatePdfMock.mockResolvedValue(buffer);
    const service = Object.create(EstimatePdfService.prototype);
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(baseEstimate) };

    const result = await service.getEstimatePdf('e1', 'c1');

    expect(service.customerEstimateRepository.findByIdForCustomer).toHaveBeenCalledWith('e1', 'c1');
    expect(buildEstimatePdfMock).toHaveBeenCalledTimes(1);
    const [estimateData, options] = buildEstimatePdfMock.mock.calls[0];
    expect(estimateData.id).toBe('e1');
    expect(options.customer).toBe(baseEstimate.Customer);
    expect(options.address).toBe(baseEstimate.Booking.Address);
    expect(result).toEqual({ buffer });
  });

  it('throws NotFoundError when the estimate belongs to another customer', async () => {
    const service = Object.create(EstimatePdfService.prototype);
    service.customerEstimateRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(null) };

    await expect(service.getEstimatePdf('e1', 'someone-else')).rejects.toThrow(NotFoundError);
    expect(buildEstimatePdfMock).not.toHaveBeenCalled();
  });

  it.each(['draft', 'declined', 'expired'])('throws NotFoundError when the estimate status is %s', async (status) => {
    const service = Object.create(EstimatePdfService.prototype);
    service.customerEstimateRepository = {
      findByIdForCustomer: jest.fn().mockResolvedValue({ ...baseEstimate, status }),
    };

    await expect(service.getEstimatePdf('e1', 'c1')).rejects.toThrow(NotFoundError);
    expect(buildEstimatePdfMock).not.toHaveBeenCalled();
  });
});

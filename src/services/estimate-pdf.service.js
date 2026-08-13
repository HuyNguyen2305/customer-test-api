import { NotFoundError } from '#configs/error.js';
import { toEstimateData } from '#service/customer-estimate.service.js';
import { buildEstimatePdf } from '#common/pdf/estimate-pdf-builder.js';
import { branding } from '#common/pdf/branding.config.js';

const PORTAL_VISIBLE_STATUSES = ['sent', 'approved'];

class EstimatePdfService {
  constructor({ customerEstimateRepository }) {
    this.customerEstimateRepository = customerEstimateRepository;
  }

  async getEstimatePdf(id, customerId) {
    const estimate = await this.customerEstimateRepository.findByIdForCustomer(id, customerId);
    if (!estimate || !PORTAL_VISIBLE_STATUSES.includes(estimate.status)) throw new NotFoundError('Estimate not found');

    const estimateData = toEstimateData(estimate);

    const buffer = await buildEstimatePdf(estimateData, {
      customer: estimate.Customer,
      address: estimate.Booking?.Address,
      branding,
    });

    return { buffer };
  }
}

export default EstimatePdfService;

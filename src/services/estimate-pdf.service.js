import { NotFoundError } from '#configs/error.js';
import { toEstimateData } from '#service/customer-estimate.service.js';
import { buildEstimatePdf } from '#common/pdf/estimate-pdf-builder.js';
import { branding } from '#common/pdf/branding.config.js';

const PORTAL_VISIBLE_STATUSES = ['sent', 'approved'];

class EstimatePdfService {
  constructor({ customerEstimateRepository, customerEstimateService }) {
    this.customerEstimateRepository = customerEstimateRepository;
    this.customerEstimateService = customerEstimateService;
  }

  async getEstimatePdf(id, customerId) {
    const estimate = await this.customerEstimateRepository.findByIdForPdf(id, customerId);
    if (!estimate || !PORTAL_VISIBLE_STATUSES.includes(estimate.status)) throw new NotFoundError('Estimate not found');

    // Estimates have no write endpoints for items, so subtotal/tax/total
    // only stay correct because every read path recomputes them - the PDF
    // is a read path too (see refreshItemCache in customer-estimate.service.js).
    await this.customerEstimateService.refreshItemCache(estimate);
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

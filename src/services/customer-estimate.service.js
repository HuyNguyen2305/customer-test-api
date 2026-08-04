import { NotFoundError } from '#configs/error.js';

function toEstimateData(estimate) {
  return {
    id: estimate.id,
    bookingId: estimate.bookingId,
    customerId: estimate.customerId,
    sourceEstimateId: estimate.sourceEstimateId,
    type: estimate.type,
    discountValue: estimate.discountValue,
    discountType: estimate.discountType,
    depositValue: estimate.depositValue,
    depositType: estimate.depositType,
    termsText: estimate.termsText,
    notesText: estimate.notesText,
    status: estimate.status,
    ...(estimate.items && {
      items: estimate.items.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        description: item.description,
        cost: item.cost,
        taxRateId: item.taxRateId,
        qty: item.qty,
        sortOrder: item.sortOrder,
      })),
    }),
  };
}

class CustomerEstimateService {
  constructor({ customerEstimateRepository }) {
    this.customerEstimateRepository = customerEstimateRepository;
  }

  async listEstimates(customerId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.customerEstimateRepository.listByCustomerId(customerId, {
      limit: pageSize,
      offset,
    });
    return {
      estimates: rows.map(toEstimateData),
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async getEstimateById(id, customerId) {
    const estimate = await this.customerEstimateRepository.findByIdForCustomer(id, customerId);
    if (!estimate) throw new NotFoundError('Estimate not found');
    return toEstimateData(estimate);
  }
}

export default CustomerEstimateService;

import { NotFoundError } from '#configs/error.js';

const PORTAL_VISIBLE_STATUSES = ['sent', 'approved'];
const STATUS_LABELS = { sent: 'Open', approved: 'Accepted' };

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
    statusLabel: STATUS_LABELS[estimate.status],
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

  async listEstimates(customerId, { page = 1, pageSize = 20, addressId } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.customerEstimateRepository.listByCustomerId(customerId, {
      limit: pageSize,
      offset,
      addressId,
      statuses: PORTAL_VISIBLE_STATUSES,
    });
    return {
      estimates: rows.map(toEstimateData),
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async getEstimateById(id, customerId) {
    const estimate = await this.customerEstimateRepository.findByIdForCustomer(id, customerId);
    if (!estimate || !PORTAL_VISIBLE_STATUSES.includes(estimate.status)) throw new NotFoundError('Estimate not found');
    return toEstimateData(estimate);
  }
}

export default CustomerEstimateService;

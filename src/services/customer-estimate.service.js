import { NotFoundError } from '#configs/error.js';
import { sequelize } from '#common/sequelize.js';
import { computeEntityTotals, recomputeItems, toNumberOrNull } from './billing-calculation.util.js';

const PORTAL_VISIBLE_STATUSES = ['sent', 'approved'];
const STATUS_LABELS = { sent: 'Open', approved: 'Accepted' };

export function toEstimateData(estimate) {
  return {
    id: estimate.id,
    bookingId: estimate.bookingId,
    customerId: estimate.customerId,
    sourceEstimateId: estimate.sourceEstimateId,
    createdAt: estimate.createdAt,
    type: estimate.type,
    discountValue: estimate.discountValue,
    discountType: estimate.discountType,
    depositValue: estimate.depositValue,
    depositType: estimate.depositType,
    termsText: estimate.termsText,
    notesText: estimate.notesText,
    status: estimate.status,
    statusLabel: STATUS_LABELS[estimate.status],
    ...computeEntityTotals(estimate),
    ...(estimate.items && {
      items: estimate.items.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        itemName: item.Item?.name ?? null,
        description: item.description,
        cost: item.cost,
        qty: item.qty,
        sortOrder: item.sortOrder,
        subtotal: toNumberOrNull(item.subtotal),
        tax1RateId: item.tax1RateId,
        tax1Name: item.tax1Name,
        tax1Rate: toNumberOrNull(item.tax1Rate),
        tax1Total: toNumberOrNull(item.tax1Total),
        tax2RateId: item.tax2RateId,
        tax2Name: item.tax2Name,
        tax2Rate: toNumberOrNull(item.tax2Rate),
        tax2Total: toNumberOrNull(item.tax2Total),
        total: toNumberOrNull(item.total),
      })),
    }),
  };
}

class CustomerEstimateService {
  constructor({
    customerEstimateRepository,
    customerEstimateItemRepository,
    invoiceGenerationService,
    customerInvoiceService,
  }) {
    this.customerEstimateRepository = customerEstimateRepository;
    this.customerEstimateItemRepository = customerEstimateItemRepository;
    this.invoiceGenerationService = invoiceGenerationService;
    this.customerInvoiceService = customerInvoiceService;
  }

  // Estimates have no write endpoints in this app - items are created
  // elsewhere, so the only way to keep each item's persisted subtotal/tax/
  // total columns from going stale is to recompute and overwrite them on
  // every read. Snapshots tax1Name/tax1Rate off the preloaded Tax1Rate/
  // Tax2Rate associations, then mutates estimate.items in place so the
  // caller's response reflects the fresh computation without a re-fetch.
  async refreshItemCache(estimate) {
    const items = estimate.items ?? [];
    for (const item of items) {
      item.tax1Name = item.Tax1Rate?.name ?? null;
      item.tax1Rate = item.Tax1Rate?.rate ?? null;
      item.tax2Name = item.Tax2Rate?.name ?? null;
      item.tax2Rate = item.Tax2Rate?.rate ?? null;
    }

    const patches = recomputeItems(items, estimate);
    await sequelize.transaction((transaction) =>
      this.customerEstimateItemRepository.updateMany(patches, { transaction }),
    );

    const patchById = new Map(patches.map((patch) => [patch.id, patch]));
    for (const item of items) Object.assign(item, patchById.get(item.id));
    return estimate;
  }

  async listEstimates(customerId, { page = 1, pageSize = 20, addressId } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.customerEstimateRepository.listByCustomerId(customerId, {
      limit: pageSize,
      offset,
      addressId,
      statuses: PORTAL_VISIBLE_STATUSES,
    });
    await Promise.all(rows.map((estimate) => this.refreshItemCache(estimate)));
    return {
      estimates: rows.map(toEstimateData),
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }

  async getEstimateById(id, customerId) {
    const estimate = await this.customerEstimateRepository.findByIdForCustomer(id, customerId);
    if (!estimate || !PORTAL_VISIBLE_STATUSES.includes(estimate.status)) throw new NotFoundError('Estimate not found');
    await this.refreshItemCache(estimate);
    return toEstimateData(estimate);
  }

  async createInvoiceFromEstimate(id, customerId) {
    const estimate = await this.customerEstimateRepository.findByIdForCustomer(id, customerId);
    if (!estimate || !PORTAL_VISIBLE_STATUSES.includes(estimate.status)) throw new NotFoundError('Estimate not found');
    await this.refreshItemCache(estimate);

    const invoice = await this.invoiceGenerationService.generateInvoiceFromEstimate(estimate, customerId);
    return this.customerInvoiceService.getInvoiceById(invoice.id, customerId);
  }
}

export default CustomerEstimateService;

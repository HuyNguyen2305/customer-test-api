import { NotFoundError } from '#configs/error.js';
import { sequelize } from '#common/sequelize.js';
import {
  computeEntityTotals,
  recomputeItems,
  toNumberOrNull,
  flattenTaxSlots,
  nestTaxSlotsPatch,
} from './billing-calculation.util.js';

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
    ...computeEntityTotals({
      items: estimate.items?.map(flattenTaxSlots),
      discountType: estimate.discountType,
      discountValue: estimate.discountValue,
    }),
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
        tax1RateId: item.taxSlots?.tax1RateId ?? null,
        tax1Name: item.taxSlots?.tax1Name ?? null,
        tax1Rate: toNumberOrNull(item.taxSlots?.tax1Rate),
        tax1Total: toNumberOrNull(item.taxSlots?.tax1Total),
        tax2RateId: item.taxSlots?.tax2RateId ?? null,
        tax2Name: item.taxSlots?.tax2Name ?? null,
        tax2Rate: toNumberOrNull(item.taxSlots?.tax2Rate),
        tax2Total: toNumberOrNull(item.taxSlots?.tax2Total),
        total: toNumberOrNull(item.total),
      })),
    }),
  };
}

class CustomerEstimateService {
  constructor({
    customerEstimateRepository,
    customerLineItemRepository,
    invoiceGenerationService,
    customerInvoiceService,
    taxRateRepository,
  }) {
    this.customerEstimateRepository = customerEstimateRepository;
    this.customerLineItemRepository = customerLineItemRepository;
    this.invoiceGenerationService = invoiceGenerationService;
    this.customerInvoiceService = customerInvoiceService;
    this.taxRateRepository = taxRateRepository;
  }

  // Estimates have no write endpoints in this app - items are created
  // elsewhere, so the only way to keep each item's persisted subtotal/tax/
  // total columns from going stale is to recompute and overwrite them on
  // every read. Snapshots tax1Name/tax1Rate off a batched TaxRate lookup
  // (tax1RateId/tax2RateId live inside taxSlots, not as real FK columns, so
  // there's no live association to include() a join through anymore), then
  // mutates estimate.items in place so the caller's response reflects the
  // fresh computation without a re-fetch.
  async refreshItemCache(estimate) {
    const items = estimate.items ?? [];
    const rateIds = [
      ...new Set(items.flatMap((item) => [item.taxSlots?.tax1RateId, item.taxSlots?.tax2RateId]).filter(Boolean)),
    ];
    const taxRates = rateIds.length ? await this.taxRateRepository.findByIds(rateIds) : [];
    const taxRatesById = new Map(taxRates.map((rate) => [rate.id, rate]));

    for (const item of items) {
      const tax1Rate = taxRatesById.get(item.taxSlots?.tax1RateId);
      const tax2Rate = taxRatesById.get(item.taxSlots?.tax2RateId);
      item.taxSlots = {
        ...item.taxSlots,
        tax1Name: tax1Rate?.name ?? null,
        tax1Rate: tax1Rate?.rate ?? null,
        tax2Name: tax2Rate?.name ?? null,
        tax2Rate: tax2Rate?.rate ?? null,
      };
    }

    const patches = recomputeItems(items.map(flattenTaxSlots), estimate).map(nestTaxSlotsPatch);
    await sequelize.transaction((transaction) => this.customerLineItemRepository.updateMany(patches, { transaction }));

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

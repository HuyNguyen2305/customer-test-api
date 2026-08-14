import { NotFoundError } from '#configs/error.js';

const PORTAL_VISIBLE_STATUSES = ['sent', 'approved'];
const STATUS_LABELS = { sent: 'Open', approved: 'Accepted' };

// Derived from the current items every time an estimate is read, mirroring
// CustomerInvoiceService.computeTotals - nothing here is persisted. Tax is
// per-item (CustomerEstimateItem.taxRateId -> TaxRate.rate), not a separate
// junction table like invoices, so it only appears when an item's row was
// loaded with its TaxRate association.
function computeEstimateTotals(estimate) {
  const items = estimate.items ?? [];

  const subtotal = items.reduce((sum, item) => sum + Number(item.cost) * item.qty, 0);
  const discountAmount =
    estimate.discountType === 'flat'
      ? Number(estimate.discountValue)
      : subtotal * (Number(estimate.discountValue) / 100);
  const taxableAmount = subtotal - discountAmount;
  // Tax each item on its own share of the taxable (post-discount) amount,
  // not its raw pre-discount cost — mirrors the taxableBase logic in
  // invoice-generation.service.js's attachEstimateTaxes, so a converted
  // invoice's tax matches what the customer saw on the estimate.
  const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0;
  const taxTotal = items.reduce((sum, item) => {
    const itemTaxableBase = Number(item.cost) * item.qty * (1 - discountRatio);
    return sum + itemTaxableBase * (Number(item.TaxRate?.rate ?? 0) / 100);
  }, 0);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxTotal,
    total: taxableAmount + taxTotal,
  };
}

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
    ...computeEstimateTotals(estimate),
    ...(estimate.items && {
      items: estimate.items.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        itemName: item.Item?.name ?? null,
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
  constructor({ customerEstimateRepository, invoiceGenerationService, customerInvoiceService }) {
    this.customerEstimateRepository = customerEstimateRepository;
    this.invoiceGenerationService = invoiceGenerationService;
    this.customerInvoiceService = customerInvoiceService;
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

  async createInvoiceFromEstimate(id, customerId) {
    const estimate = await this.customerEstimateRepository.findByIdForCustomer(id, customerId);
    if (!estimate || !PORTAL_VISIBLE_STATUSES.includes(estimate.status)) throw new NotFoundError('Estimate not found');

    const invoice = await this.invoiceGenerationService.generateInvoiceFromEstimate(estimate, customerId);
    return this.customerInvoiceService.getInvoiceById(invoice.id, customerId);
  }
}

export default CustomerEstimateService;

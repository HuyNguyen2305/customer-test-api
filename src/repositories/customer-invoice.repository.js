import { sequelize } from '#common/sequelize.js';
import { BaseRepository } from '#common/base-repository.js';

const STATUS_ORDER = ['draft', 'sent', 'void', 'write_off', 'paid'];

class CustomerInvoiceRepository extends BaseRepository {
  constructor({ customerInvoiceModel, customerInvoiceItemModel, customerModel }) {
    super(customerInvoiceModel);
    this.customerInvoiceItemModel = customerInvoiceItemModel;
    this.customerModel = customerModel;
  }

  findByBookingId(bookingId) {
    return this.findOne({ where: { bookingId } });
  }

  findByEstimateId(estimateId) {
    return this.findOne({ where: { estimateId } });
  }

  createInvoice(data, options) {
    return this.create(data, options);
  }

  findBySourceInvoiceId(sourceInvoiceId) {
    return this.findAll({ where: { sourceInvoiceId }, order: [['createdAt', 'DESC']] });
  }

  listByCustomerId(customerId, { limit, offset, addressId, status, statusOrder } = {}) {
    const order = [];
    if (statusOrder === 'asc' || statusOrder === 'desc') {
      const statusCase = STATUS_ORDER.map((value, index) => `WHEN '${value}' THEN ${index}`).join(' ');
      order.push([sequelize.literal(`CASE status ${statusCase} END`), statusOrder.toUpperCase()]);
    }
    order.push(['createdAt', 'DESC']);

    return this.findAndCountAll({
      where: { customerId, ...(addressId && { addressId }), ...(status && { status }) },
      limit,
      offset,
      order,
      // Only excludes updatedAt, not createdAt: with a hasMany include + limit,
      // Sequelize wraps this in a subquery, and an ORDER BY that references a
      // column missing from the subquery's SELECT fails outright. toInvoiceData
      // already whitelists response fields, so createdAt never reaches the API
      // even though it stays in the query.
      attributes: { exclude: ['updatedAt'] },
      // No 'address' join: toInvoiceData builds addressLabel/addressLine1/etc.
      // from the addressSnapshot JSONB column already on this row, never from
      // the associated Address.
      include: [{ model: this.scopeModel(this.customerInvoiceItemModel), as: 'items' }],
      // Without this, the join to 'items' makes count() tally one row per
      // item instead of per invoice, inflating pagination totals for any
      // invoice with more than one line item.
      distinct: true,
    });
  }

  // Lean JSON-detail shape: no address join (same reason as listByCustomerId)
  // and no Customer join (only the PDF route needs it - see findByIdForPdf).
  findByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: { exclude: ['updatedAt'] },
      include: [{ model: this.scopeModel(this.customerInvoiceItemModel), as: 'items' }],
    });
  }

  // Adds the Customer join back on top of findByIdForCustomer's shape - only
  // buildInvoicePdf (via InvoicePdfService) reads invoice.Customer.
  findByIdForPdf(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: { exclude: ['updatedAt'] },
      include: [
        { model: this.scopeModel(this.customerInvoiceItemModel), as: 'items' },
        { model: this.scopeModel(this.customerModel), as: 'Customer' },
      ],
    });
  }

  // Minimal shape for the ownership/status pre-check in
  // CustomerInvoiceItemService.requireOwnedDraftInvoice - that check only
  // reads status/discountType/discountValue, never items or any join.
  findSummaryByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: ['id', 'status', 'discountType', 'discountValue', 'customerId'],
    });
  }

  sumBalanceDueByCustomerId(customerId) {
    return this.setSchema()
      .sum('balanceDue', { where: { customerId } })
      .then((sum) => sum ?? 0);
  }
}

export default CustomerInvoiceRepository;

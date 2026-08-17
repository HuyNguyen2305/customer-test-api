import { BaseRepository } from '#common/base-repository.js';

class CustomerEstimateRepository extends BaseRepository {
  constructor({
    customerEstimateModel,
    customerEstimateItemModel,
    bookingModel,
    addressModel,
    customerModel,
    taxRateModel,
    itemModel,
  }) {
    super(customerEstimateModel);
    this.customerEstimateItemModel = customerEstimateItemModel;
    this.bookingModel = bookingModel;
    this.addressModel = addressModel;
    this.customerModel = customerModel;
    this.taxRateModel = taxRateModel;
    this.itemModel = itemModel;
  }

  // Only .name/.rate are ever read (toEstimateData snapshots them onto the
  // item's tax1Name/tax1Rate columns), so both tax rate joins are trimmed to
  // just those two columns.
  itemIncludes() {
    return [
      { model: this.scopeModel(this.taxRateModel), as: 'Tax1Rate', attributes: ['name', 'rate'] },
      { model: this.scopeModel(this.taxRateModel), as: 'Tax2Rate', attributes: ['name', 'rate'] },
    ];
  }

  listByCustomerId(customerId, { limit, offset, addressId, statuses } = {}) {
    return this.findAndCountAll({
      where: { customerId, ...(statuses && { status: statuses }) },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      // Only excludes updatedAt, not createdAt: with a hasMany include + limit,
      // Sequelize wraps this in a subquery, and an ORDER BY that references a
      // column missing from the subquery's SELECT fails outright. toEstimateData
      // already whitelists response fields, so createdAt never reaches the API
      // even though it stays in the query (same fix as the invoice repository).
      attributes: { exclude: ['updatedAt'] },
      include: [
        { model: this.scopeModel(this.customerEstimateItemModel), as: 'items', include: this.itemIncludes() },
        ...(addressId
          ? [{ model: this.scopeModel(this.bookingModel), attributes: [], where: { addressId }, required: true }]
          : []),
      ],
    });
  }

  updateStatus(id, customerId, status, options = {}) {
    return this.update({ status }, { where: { id, customerId }, ...options });
  }

  // Lean JSON-detail shape: no Booking/Address/Customer joins - toEstimateData
  // never reads them, and generateInvoiceFromEstimate re-fetches the booking
  // itself. Only the PDF route needs them (see findByIdForPdf).
  findByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: { exclude: ['updatedAt'] },
      include: [
        {
          model: this.scopeModel(this.customerEstimateItemModel),
          as: 'items',
          include: [...this.itemIncludes(), { model: this.scopeModel(this.itemModel), attributes: ['name'] }],
        },
      ],
    });
  }

  // Adds the Booking->Address and Customer joins back on top of
  // findByIdForCustomer's shape - only buildEstimatePdf (via EstimatePdfService)
  // reads estimate.Booking?.Address and estimate.Customer.
  findByIdForPdf(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: { exclude: ['updatedAt'] },
      include: [
        {
          model: this.scopeModel(this.customerEstimateItemModel),
          as: 'items',
          include: [...this.itemIncludes(), { model: this.scopeModel(this.itemModel), attributes: ['name'] }],
        },
        {
          model: this.scopeModel(this.bookingModel),
          include: [{ model: this.scopeModel(this.addressModel) }],
        },
        { model: this.scopeModel(this.customerModel), as: 'Customer' },
      ],
    });
  }
}

export default CustomerEstimateRepository;

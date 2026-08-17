import { BaseRepository } from '#common/base-repository.js';

class CustomerInvoiceItemRepository extends BaseRepository {
  constructor({ customerInvoiceItemModel }) {
    super(customerInvoiceItemModel);
  }

  listByInvoiceId(customerInvoiceId, options = {}) {
    return this.findAll({
      where: { customerInvoiceId },
      order: [['sortOrder', 'ASC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      ...options,
    });
  }

  createItem(data, options) {
    return this.create(data, options);
  }

  bulkCreateItems(items, options) {
    if (!items.length) return Promise.resolve([]);
    return this.bulkCreate(items, options);
  }

  async updateItem(id, customerInvoiceId, data, options = {}) {
    const scoped = this.setSchema();
    const [updated] = await scoped.update(data, { where: { id, customerInvoiceId }, ...options });
    if (!updated) return null;
    return scoped.findOne({ where: { id, customerInvoiceId }, ...options });
  }

  async deleteItem(id, customerInvoiceId, options = {}) {
    const destroyed = await this.destroy({ where: { id, customerInvoiceId }, ...options });
    return destroyed > 0;
  }

  // Writes back the recomputed subtotal/tax/total columns for every item on
  // one invoice - a plain loop rather than bulkCreate's updateOnDuplicate,
  // since invoices carry few line items and each row needs a different patch.
  async updateMany(patches, options = {}) {
    const scoped = this.setSchema();
    for (const { id, ...data } of patches) {
      await scoped.update(data, { where: { id }, ...options });
    }
  }
}

export default CustomerInvoiceItemRepository;

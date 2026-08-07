import { BaseRepository } from '#common/base-repository.js';

class CustomerInvoiceItemRepository extends BaseRepository {
  constructor({ customerInvoiceItemModel }) {
    super(customerInvoiceItemModel);
  }

  listByInvoiceId(customerInvoiceId) {
    return this.findAll({ where: { customerInvoiceId }, order: [['sortOrder', 'ASC']] });
  }

  createItem(data) {
    return this.create(data);
  }

  bulkCreateItems(items) {
    if (!items.length) return Promise.resolve([]);
    return this.bulkCreate(items);
  }

  async updateItem(id, customerInvoiceId, data) {
    const scoped = this.setSchema();
    const [updated] = await scoped.update(data, { where: { id, customerInvoiceId } });
    if (!updated) return null;
    return scoped.findOne({ where: { id, customerInvoiceId } });
  }

  async deleteItem(id, customerInvoiceId) {
    const destroyed = await this.destroy({ where: { id, customerInvoiceId } });
    return destroyed > 0;
  }
}

export default CustomerInvoiceItemRepository;

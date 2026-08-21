import { BaseRepository } from '#common/base-repository.js';

class CustomerLineItemRepository extends BaseRepository {
  constructor({ customerLineItemModel }) {
    super(customerLineItemModel);
  }

  listByParent(parentId, parentType, options = {}) {
    return this.findAll({
      where: { parentId, parentType },
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

  async updateItem(id, parentId, parentType, data, options = {}) {
    const scoped = this.setSchema();
    const [updated] = await scoped.update(data, { where: { id, parentId, parentType }, ...options });
    if (!updated) return null;
    return scoped.findOne({ where: { id, parentId, parentType }, ...options });
  }

  async deleteItem(id, parentId, parentType, options = {}) {
    const destroyed = await this.destroy({ where: { id, parentId, parentType }, ...options });
    return destroyed > 0;
  }

  // Writes back the recomputed subtotal/tax/total columns for every item on
  // one estimate/invoice - a plain loop rather than bulkCreate's
  // updateOnDuplicate, since each row needs a different patch and there are
  // few items per parent. Scoped by id only (patches come from an already
  // parent-scoped read), same as before the merge.
  async updateMany(patches, options = {}) {
    const scoped = this.setSchema();
    await Promise.all(patches.map(({ id, ...data }) => scoped.update(data, { where: { id }, ...options })));
  }
}

export default CustomerLineItemRepository;

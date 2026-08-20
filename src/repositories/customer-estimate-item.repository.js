import { BaseRepository } from '#common/base-repository.js';

class CustomerEstimateItemRepository extends BaseRepository {
  constructor({ customerEstimateItemModel }) {
    super(customerEstimateItemModel);
  }

  // Writes back the recomputed subtotal/tax/total columns for every item on
  // one estimate - estimates have no write endpoints of their own, so this
  // runs on every read (compute-and-cache) rather than after a client write.
  async updateMany(patches, options = {}) {
    const scoped = this.setSchema();
    await Promise.all(patches.map(({ id, ...data }) => scoped.update(data, { where: { id }, ...options })));
  }
}

export default CustomerEstimateItemRepository;

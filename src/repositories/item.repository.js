import { BaseRepository } from '#common/base-repository.js';

class ItemRepository extends BaseRepository {
  constructor({ itemModel }) {
    super(itemModel);
  }
}

export default ItemRepository;

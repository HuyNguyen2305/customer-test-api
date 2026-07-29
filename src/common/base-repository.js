import { requestContext } from '#common/request-context.js';

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  setSchema() {
    const identity = requestContext.get('identity');
    const schema = identity?.schema;
    return schema ? this.model.schema(schema) : this.model;
  }

  findAll(options) {
    return this.setSchema().findAll(options);
  }

  findByPk(id, options) {
    return this.setSchema().findByPk(id, options);
  }

  findOne(options) {
    return this.setSchema().findOne(options);
  }

  findAndCountAll(options) {
    return this.setSchema().findAndCountAll(options);
  }

  create(data, options) {
    return this.setSchema().create(data, options);
  }

  update(data, options) {
    return this.setSchema().update(data, options);
  }

  destroy(options) {
    return this.setSchema().destroy(options);
  }
}

export default BaseRepository;

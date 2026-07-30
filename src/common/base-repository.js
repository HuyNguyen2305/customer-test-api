import { requestContext } from '#common/request-context.js';

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  setSchema() {
    return this.scopeModel(this.model);
  }

  // Applies the same tenant-schema scoping as setSchema() to an arbitrary
  // model, so models referenced via `include` (association joins) query the
  // same schema as the primary model instead of silently falling back to
  // the default/public schema.
  scopeModel(model) {
    const identity = requestContext.get('identity');
    const schema = identity?.schema;
    return schema ? model.schema(schema) : model;
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

  bulkCreate(data, options) {
    return this.setSchema().bulkCreate(data, options);
  }

  update(data, options) {
    return this.setSchema().update(data, options);
  }

  destroy(options) {
    return this.setSchema().destroy(options);
  }
}

export default BaseRepository;

import { requestContext } from '#common/request-context.js';

class AuthRepository {
  constructor({ customerModel, revokedTokenModel }) {
    this.customerModel = customerModel;
    this.revokedTokenModel = revokedTokenModel;
  }

  scopeModel(model) {
    const identity = requestContext.get('identity');
    const schema = identity?.schema;
    return schema ? model.schema(schema) : model;
  }

  findByUsername(username) {
    return this.scopeModel(this.customerModel).findOne({ where: { username } });
  }

  createCustomer(data) {
    return this.scopeModel(this.customerModel).create(data);
  }

  updatePasswordHash(customerId, passwordHash) {
    return this.scopeModel(this.customerModel).update({ passwordHash }, { where: { id: customerId } });
  }

  revokeToken({ jti, customerId, expiresAt }) {
    return this.scopeModel(this.revokedTokenModel).create({ jti, customerId, expiresAt });
  }

  async isTokenRevoked(jti) {
    const revoked = await this.scopeModel(this.revokedTokenModel).findOne({ where: { jti } });
    return Boolean(revoked);
  }
}

export default AuthRepository;

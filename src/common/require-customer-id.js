import { requestContext } from '#common/request-context.js';
import { UnauthorizedError } from '#configs/error.js';

export function requireCustomerId() {
  const { customerId } = requestContext.get('identity') ?? {};
  if (!customerId) throw new UnauthorizedError('Authentication required');
  return customerId;
}

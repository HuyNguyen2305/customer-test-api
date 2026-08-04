import { requestContext } from '#common/request-context.js';
import { UnauthorizedError } from '#configs/error.js';

export function requireTokenClaims() {
  const tokenClaims = requestContext.get('tokenClaims');
  if (!tokenClaims) throw new UnauthorizedError('A valid access token is required');
  return tokenClaims;
}

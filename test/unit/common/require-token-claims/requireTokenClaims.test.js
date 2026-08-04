import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { requireTokenClaims } = await import('#common/require-token-claims.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('requireTokenClaims', () => {
  beforeEach(() => getMock.mockReset());

  it('returns the token claims when present', () => {
    getMock.mockReturnValue({ jti: 't1', exp: 123 });

    expect(requireTokenClaims()).toEqual({ jti: 't1', exp: 123 });
  });

  it('throws UnauthorizedError when there are no token claims', () => {
    getMock.mockReturnValue(undefined);

    expect(() => requireTokenClaims()).toThrow(UnauthorizedError);
  });
});

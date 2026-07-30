import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { requireCustomerId } = await import('#common/require-customer-id.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('requireCustomerId', () => {
  beforeEach(() => getMock.mockReset());

  it('returns the customerId from the identity when present', () => {
    getMock.mockReturnValue({ customerId: 'c1' });

    expect(requireCustomerId()).toBe('c1');
  });

  it('throws UnauthorizedError when there is no identity', () => {
    getMock.mockReturnValue(undefined);

    expect(() => requireCustomerId()).toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when identity has no customerId', () => {
    getMock.mockReturnValue({ schema: 'tenant_x' });

    expect(() => requireCustomerId()).toThrow(UnauthorizedError);
  });
});

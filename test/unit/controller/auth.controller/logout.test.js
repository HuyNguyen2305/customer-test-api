import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();
const requireTokenClaimsMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

jest.unstable_mockModule('#common/require-token-claims.js', () => ({
  requireTokenClaims: requireTokenClaimsMock,
}));

const { default: AuthController } = await import('#controller/auth.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('AuthController.logout', () => {
  beforeEach(() => {
    requireCustomerIdMock.mockReset();
    requireTokenClaimsMock.mockReset();
  });

  it('revokes the current token and confirms logout', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    requireTokenClaimsMock.mockReturnValue({ jti: 't1', exp: 123 });
    const controller = Object.create(AuthController.prototype);
    controller.authService = { logout: jest.fn().mockResolvedValue(undefined) };
    const reply = { send: jest.fn() };

    await controller.logout({}, reply);

    expect(controller.authService.logout).toHaveBeenCalledWith({ jti: 't1', customerId: 'c1', exp: 123 });
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Logged out successfully', data: null });
  });

  it('throws when there are no valid token claims', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    requireTokenClaimsMock.mockImplementation(() => {
      throw new UnauthorizedError('A valid access token is required');
    });
    const controller = Object.create(AuthController.prototype);
    controller.authService = { logout: jest.fn() };
    const reply = { send: jest.fn() };

    await expect(controller.logout({}, reply)).rejects.toThrow(UnauthorizedError);
    expect(controller.authService.logout).not.toHaveBeenCalled();
  });
});

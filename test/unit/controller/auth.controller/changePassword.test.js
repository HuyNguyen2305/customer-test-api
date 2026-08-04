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
const { UnauthorizedError, BadRequestError } = await import('#configs/error.js');

describe('AuthController.changePassword', () => {
  beforeEach(() => {
    requireCustomerIdMock.mockReset();
    requireTokenClaimsMock.mockReset();
  });

  it('changes the password and confirms success', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    requireTokenClaimsMock.mockReturnValue({ jti: 't1', exp: 123 });
    const controller = Object.create(AuthController.prototype);
    controller.authService = { changePassword: jest.fn().mockResolvedValue(undefined) };
    const reply = { send: jest.fn() };
    const request = { body: { newPassword: 'newpass456', confirmPassword: 'newpass456' } };

    await controller.changePassword(request, reply);

    expect(controller.authService.changePassword).toHaveBeenCalledWith({
      customerId: 'c1',
      newPassword: 'newpass456',
      jti: 't1',
      exp: 123,
    });
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Password changed successfully', data: null });
  });

  it('throws when there are no valid token claims', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    requireTokenClaimsMock.mockImplementation(() => {
      throw new UnauthorizedError('A valid access token is required');
    });
    const controller = Object.create(AuthController.prototype);
    controller.authService = { changePassword: jest.fn() };
    const reply = { send: jest.fn() };
    const request = { body: { newPassword: 'newpass456', confirmPassword: 'newpass456' } };

    await expect(controller.changePassword(request, reply)).rejects.toThrow(UnauthorizedError);
    expect(controller.authService.changePassword).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when passwords do not match', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    requireTokenClaimsMock.mockReturnValue({ jti: 't1', exp: 123 });
    const controller = Object.create(AuthController.prototype);
    controller.authService = { changePassword: jest.fn() };
    const reply = { send: jest.fn() };
    const request = { body: { newPassword: 'newpass456', confirmPassword: 'different' } };

    await expect(controller.changePassword(request, reply)).rejects.toThrow(BadRequestError);
    expect(controller.authService.changePassword).not.toHaveBeenCalled();
  });
});

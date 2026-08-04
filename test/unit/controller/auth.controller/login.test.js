import { jest } from '@jest/globals';

const { default: AuthController } = await import('#controller/auth.controller.js');
const { BadRequestError } = await import('#configs/error.js');

describe('AuthController.login', () => {
  it('sends the token and customer data on success', async () => {
    const data = { token: 't', customer: { id: 'c1' } };
    const controller = Object.create(AuthController.prototype);
    controller.authService = { login: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { body: { username: 'jane.doe', password: 'password123' } };

    await controller.login(request, reply);

    expect(controller.authService.login).toHaveBeenCalledWith('jane.doe', 'password123');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Login successful', data });
  });

  it('throws BadRequestError when username or password is missing', async () => {
    const controller = Object.create(AuthController.prototype);
    controller.authService = { login: jest.fn() };
    const reply = { send: jest.fn() };

    await expect(controller.login({ body: { username: 'jane.doe' } }, reply)).rejects.toThrow(BadRequestError);
    expect(controller.authService.login).not.toHaveBeenCalled();
  });
});

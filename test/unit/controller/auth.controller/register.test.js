import { jest } from '@jest/globals';

const { default: AuthController } = await import('#controller/auth.controller.js');
const { BadRequestError } = await import('#configs/error.js');

describe('AuthController.register', () => {
  it('sends the created customer on success', async () => {
    const data = { id: 'c1', username: 'jane.doe' };
    const controller = Object.create(AuthController.prototype);
    controller.authService = { register: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { body: { username: 'jane.doe', password: 'password123', confirmPassword: 'password123' } };

    await controller.register(request, reply);

    expect(controller.authService.register).toHaveBeenCalledWith('jane.doe', 'password123');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Registration successful', data });
  });

  it('throws BadRequestError when username is missing', async () => {
    const controller = Object.create(AuthController.prototype);
    controller.authService = { register: jest.fn() };
    const reply = { send: jest.fn() };
    const request = { body: { password: 'password123', confirmPassword: 'password123' } };

    await expect(controller.register(request, reply)).rejects.toThrow(BadRequestError);
    expect(controller.authService.register).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when passwords do not match', async () => {
    const controller = Object.create(AuthController.prototype);
    controller.authService = { register: jest.fn() };
    const reply = { send: jest.fn() };
    const request = { body: { username: 'jane.doe', password: 'password123', confirmPassword: 'different' } };

    await expect(controller.register(request, reply)).rejects.toThrow(BadRequestError);
    expect(controller.authService.register).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when password is too short', async () => {
    const controller = Object.create(AuthController.prototype);
    controller.authService = { register: jest.fn() };
    const reply = { send: jest.fn() };
    const request = { body: { username: 'jane.doe', password: 'short', confirmPassword: 'short' } };

    await expect(controller.register(request, reply)).rejects.toThrow(BadRequestError);
    expect(controller.authService.register).not.toHaveBeenCalled();
  });
});

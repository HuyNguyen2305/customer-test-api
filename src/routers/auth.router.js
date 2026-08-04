import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { registerSchema, loginSchema, logoutSchema, changePasswordSchema } from '#schemas/auth.schema.js';

export default async function authRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.AUTH_CONTROLLER);

  fastify.post(
    '/auth/register',
    { schema: registerSchema, config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    (request, reply) => controller.register(request, reply),
  );

  fastify.post(
    '/auth/login',
    { schema: loginSchema, config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    (request, reply) => controller.login(request, reply),
  );

  fastify.post('/auth/logout', { schema: logoutSchema }, (request, reply) => controller.logout(request, reply));

  fastify.post('/auth/change-password', { schema: changePasswordSchema }, (request, reply) =>
    controller.changePassword(request, reply),
  );
}

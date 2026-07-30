import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { getProfileSchema } from '#schemas/customer.schema.js';

export default async function customerRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_CONTROLLER);

  fastify.get('/customer/profile', { schema: getProfileSchema }, (request, reply) =>
    controller.getProfile(request, reply),
  );
}

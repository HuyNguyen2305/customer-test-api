import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { getProfileSchema, setDefaultAddressSchema } from '#schemas/customer.schema.js';

export default async function customerRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_CONTROLLER);

  fastify.get('/customer/profile', { schema: getProfileSchema }, (request, reply) =>
    controller.getProfile(request, reply),
  );

  fastify.post('/customer/addresses/:id/default', { schema: setDefaultAddressSchema }, (request, reply) =>
    controller.setDefaultAddress(request, reply),
  );
}

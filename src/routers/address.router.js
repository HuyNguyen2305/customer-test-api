import { CONTROLLER_KEYS } from '#constants/singleton.js';
import {
  listAddressesSchema,
  getAddressByIdSchema,
  createAddressSchema,
  updateAddressSchema,
  deleteAddressSchema,
} from '#schemas/address.schema.js';

export default async function addressRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.ADDRESS_CONTROLLER);

  fastify.get('/customer/addresses', { schema: listAddressesSchema }, (request, reply) =>
    controller.listAddresses(request, reply),
  );

  fastify.get('/customer/addresses/:id', { schema: getAddressByIdSchema }, (request, reply) =>
    controller.getAddressById(request, reply),
  );

  fastify.post('/customer/addresses', { schema: createAddressSchema }, (request, reply) =>
    controller.createAddress(request, reply),
  );

  fastify.patch('/customer/addresses/:id', { schema: updateAddressSchema }, (request, reply) =>
    controller.updateAddress(request, reply),
  );

  fastify.delete('/customer/addresses/:id', { schema: deleteAddressSchema }, (request, reply) =>
    controller.deleteAddress(request, reply),
  );
}

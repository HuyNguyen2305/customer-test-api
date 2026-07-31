import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { listPaymentMethodsSchema, setDefaultPaymentMethodSchema } from '#schemas/customer-payment-method.schema.js';

export default async function customerPaymentMethodRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_PAYMENT_METHOD_CONTROLLER);

  fastify.get('/customer/payment-methods', { schema: listPaymentMethodsSchema }, (request, reply) =>
    controller.listPaymentMethods(request, reply),
  );

  fastify.post(
    '/customer/payment-methods/:id/default',
    { schema: setDefaultPaymentMethodSchema },
    (request, reply) => controller.setDefault(request, reply),
  );
}

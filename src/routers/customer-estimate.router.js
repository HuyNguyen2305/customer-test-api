import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { listEstimatesSchema, getEstimateByIdSchema } from '#schemas/customer-estimate.schema.js';

export default async function customerEstimateRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_ESTIMATE_CONTROLLER);

  fastify.get('/customer/estimates', { schema: listEstimatesSchema }, (request, reply) =>
    controller.listEstimates(request, reply),
  );

  fastify.get('/customer/estimates/:id', { schema: getEstimateByIdSchema }, (request, reply) =>
    controller.getEstimateById(request, reply),
  );
}

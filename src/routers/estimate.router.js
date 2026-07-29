import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { listEstimatesSchema, getEstimateByIdSchema, createEstimateSchema } from '#schemas/estimate.schema.js';

export default async function estimateRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.ESTIMATE_CONTROLLER);

  fastify.get('/estimates', { schema: listEstimatesSchema }, (request, reply) =>
    controller.listEstimates(request, reply),
  );

  fastify.get('/estimates/:id', { schema: getEstimateByIdSchema }, (request, reply) =>
    controller.getEstimateById(request, reply),
  );

  fastify.post('/estimates', { schema: createEstimateSchema }, (request, reply) =>
    controller.createEstimate(request, reply),
  );
}

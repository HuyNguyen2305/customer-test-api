import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { listWorkOrdersSchema, getWorkOrderByIdSchema } from '#schemas/work-order.schema.js';

export default async function workOrderRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.WORK_ORDER_CONTROLLER);

  fastify.get('/customer/work-orders', { schema: listWorkOrdersSchema }, (request, reply) =>
    controller.listWorkOrders(request, reply),
  );

  fastify.get('/customer/work-orders/:id', { schema: getWorkOrderByIdSchema }, (request, reply) =>
    controller.getWorkOrderById(request, reply),
  );
}

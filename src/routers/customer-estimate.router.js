import { CONTROLLER_KEYS } from '#constants/singleton.js';
import {
  listEstimatesSchema,
  getEstimateByIdSchema,
  getEstimatePdfSchema,
  createInvoiceFromEstimateSchema,
} from '#schemas/customer-estimate.schema.js';

export default async function customerEstimateRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_ESTIMATE_CONTROLLER);

  fastify.get('/customer/estimates', { schema: listEstimatesSchema }, (request, reply) =>
    controller.listEstimates(request, reply),
  );

  fastify.get('/customer/estimates/:id', { schema: getEstimateByIdSchema }, (request, reply) =>
    controller.getEstimateById(request, reply),
  );

  fastify.get('/customer/estimates/:id/pdf', { schema: getEstimatePdfSchema }, (request, reply) =>
    controller.getEstimatePdf(request, reply),
  );

  fastify.post('/customer/estimates/:id/invoice', { schema: createInvoiceFromEstimateSchema }, (request, reply) =>
    controller.createInvoice(request, reply),
  );
}

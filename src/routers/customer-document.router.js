import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { listDocumentsSchema } from '#schemas/customer-document.schema.js';

export default async function customerDocumentRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_DOCUMENT_CONTROLLER);

  fastify.get('/customer/documents', { schema: listDocumentsSchema }, (request, reply) =>
    controller.listDocuments(request, reply),
  );
}

import { CONTROLLER_KEYS } from '#constants/singleton.js';
import {
  listDocumentsSchema,
  getDocumentByIdSchema,
  downloadDocumentSchema,
  createDocumentSchema,
} from '#schemas/document.schema.js';

export default async function documentRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.DOCUMENT_CONTROLLER);

  fastify.get('/documents', { schema: listDocumentsSchema }, (request, reply) =>
    controller.listDocuments(request, reply),
  );

  fastify.get('/documents/:id', { schema: getDocumentByIdSchema }, (request, reply) =>
    controller.getDocumentById(request, reply),
  );

  fastify.get('/documents/:id/download', { schema: downloadDocumentSchema }, (request, reply) =>
    controller.downloadDocument(request, reply),
  );

  fastify.post('/documents', { schema: createDocumentSchema }, (request, reply) =>
    controller.createDocument(request, reply),
  );
}

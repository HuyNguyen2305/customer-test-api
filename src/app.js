import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import AutoLoad from '@fastify/autoload';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import container from './container.js';
import { requestContext } from '#common/request-context.js';
import { CustomError } from '#configs/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp(opts = {}) {
  const app = Fastify(opts);

  app.decorate('container', container);

  app.addHook('onRequest', (request, reply, done) => {
    requestContext.run(new Map(), () => {
      // Placeholder for the future `customer-id`/`customer` Passport strategy —
      // once auth exists, identity population moves there and this hook reverts
      // to just establishing the AsyncLocalStorage context.
      requestContext.set('identity', {
        schema: request.headers['x-tenant-schema'],
        customerId: request.headers['x-customer-id'],
      });
      done();
    });
  });

  app.register(multipart, {
    attachFieldsToBody: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Customer Portal API',
        description: 'Customer Portal API - Fastify + Sequelize + Awilix',
        version: '1.0.0',
      },
    },
  });

  app.register(swaggerUi, {
    routePrefix: '/documentation',
  });

  app.register(AutoLoad, {
    dir: path.join(__dirname, 'routers'),
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof CustomError) {
      reply.status(error.statusCode).send({ success: false, message: error.message });
      return;
    }
    reply.status(500).send({ success: false, message: 'Internal Server Error' });
  });

  return app;
}

export default buildApp;

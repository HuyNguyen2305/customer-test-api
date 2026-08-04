import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import AutoLoad from '@fastify/autoload';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from 'jsonwebtoken';

import container from './container.js';
import { requestContext } from '#common/request-context.js';
import { CustomError } from '#configs/error.js';
import { REPOSITORY_KEYS } from '#constants/singleton.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp(opts = {}) {
  const app = Fastify(opts);

  app.decorate('container', container);

  app.addHook('onRequest', (request, reply, done) => {
    requestContext.run(new Map(), () => {
      const schema = request.headers['x-tenant-schema'];
      // customerId is only ever set below, after a Bearer token is verified —
      // never trust a client-supplied customerId header for identity.
      requestContext.set('identity', { schema });

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        done();
        return;
      }

      // done() is called from within this async IIFE (itself invoked synchronously
      // inside the requestContext.run callback above) so the AsyncLocalStorage
      // context stays rooted here — returning a Promise from the hook instead would
      // let Fastify's own continuation dispatch the route handler outside this context,
      // silently dropping the identity/tokenClaims we set below.
      (async () => {
        try {
          const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
          const authRepository = app.container.resolve(REPOSITORY_KEYS.AUTH_REPOSITORY);
          if (!(await authRepository.isTokenRevoked(payload.jti))) {
            requestContext.set('identity', { schema, customerId: payload.customerId });
            requestContext.set('tokenClaims', { jti: payload.jti, exp: payload.exp });
          }
        } catch {
          // invalid/expired token: keep header-based identity, no tokenClaims
        } finally {
          done();
        }
      })();
    });
  });

  app.register(multipart, {
    attachFieldsToBody: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  // global: false — only routes that opt in via `config: { rateLimit: {...} }`
  // (currently /auth/login and /auth/register) are throttled.
  app.register(rateLimit, { global: false });

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
    // Framework-level client errors (e.g. @fastify/rate-limit's 429, Fastify's own
    // schema-validation 400s) carry a safe, user-facing message — pass them through
    // instead of collapsing every non-CustomError into a generic 500.
    if (error.statusCode && error.statusCode < 500) {
      reply.status(error.statusCode).send({ success: false, message: error.message });
      return;
    }
    reply.status(500).send({ success: false, message: 'Internal Server Error' });
  });

  return app;
}

export default buildApp;

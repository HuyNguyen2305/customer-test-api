import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { getBalanceSchema, payBalanceSchema } from '#schemas/balance.schema.js';

export default async function balanceRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.BALANCE_CONTROLLER);

  fastify.get('/balance', { schema: getBalanceSchema }, (request, reply) => controller.getBalance(request, reply));

  fastify.post('/balance/pay', { schema: payBalanceSchema }, (request, reply) => controller.payBalance(request, reply));
}

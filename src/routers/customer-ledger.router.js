import { CONTROLLER_KEYS } from '#constants/singleton.js';
import { getBalanceSchema, listLedgerSchema } from '#schemas/customer-ledger.schema.js';

export default async function customerLedgerRouter(fastify, opts) {
  const controller = fastify.container.resolve(CONTROLLER_KEYS.CUSTOMER_LEDGER_CONTROLLER);

  fastify.get('/customer/balance', { schema: getBalanceSchema }, (request, reply) =>
    controller.getBalance(request, reply),
  );

  fastify.get('/customer/ledger', { schema: listLedgerSchema }, (request, reply) =>
    controller.listLedger(request, reply),
  );
}

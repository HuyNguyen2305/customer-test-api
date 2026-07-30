import { requireCustomerId } from '#common/require-customer-id.js';

class CustomerLedgerController {
  constructor({ ledgerService }) {
    this.ledgerService = ledgerService;
  }

  async getBalance(request, reply) {
    const customerId = requireCustomerId();
    const balance = await this.ledgerService.getCustomerBalance(customerId);
    reply.send({ success: true, message: 'Balance retrieved', data: { balance } });
  }

  async listLedger(request, reply) {
    const customerId = requireCustomerId();
    const { page, pageSize } = request.query;
    const { entries, pagination } = await this.ledgerService.listLedger(customerId, { page, pageSize });
    reply.send({ success: true, message: 'Ledger retrieved', data: entries, pagination });
  }
}

export default CustomerLedgerController;

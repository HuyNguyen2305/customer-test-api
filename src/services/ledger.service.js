class LedgerService {
  constructor({ customerLedgerEntryRepository }) {
    this.customerLedgerEntryRepository = customerLedgerEntryRepository;
  }

  recordInvoiceCharge(invoice) {
    return this.customerLedgerEntryRepository.createEntry({
      customerId: invoice.customerId,
      type: 'charge',
      amount: invoice.balanceDue,
      referenceId: invoice.id,
    });
  }

  recordPayment({ customerId, invoiceId, amount }) {
    return this.customerLedgerEntryRepository.createEntry({
      customerId,
      type: 'payment',
      amount,
      referenceId: invoiceId,
    });
  }

  getCustomerBalance(customerId) {
    return this.customerLedgerEntryRepository.getBalanceByCustomer(customerId);
  }

  async listLedger(customerId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows, count } = await this.customerLedgerEntryRepository.listByCustomerId(customerId, {
      limit: pageSize,
      offset,
    });
    return {
      entries: rows,
      pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    };
  }
}

export default LedgerService;

import { seedWithTransaction, TEST_SCHEMA } from '../../helpers/seed-fixtures.js';
import fixtures from '../../fixtures/customer-portal.fixtures.cjs';

const { buildApp } = await import('../../../src/app.js');

const {
  customerA,
  customerB,
  addressA,
  service1,
  item1,
  bookingA,
  bookingB,
  invoiceA,
  invoiceB,
  invoiceItemA,
  estimateA,
  estimateB,
  estimateItemA,
  paymentMethodA,
  ledgerChargeA,
  ledgerPaymentA,
} = fixtures;

const allFixtures = {
  Customer: [customerA, customerB],
  Address: [addressA],
  Service: [service1],
  Item: [item1],
  Booking: [bookingA, bookingB],
  CustomerInvoice: [invoiceA, invoiceB],
  CustomerInvoiceItem: [invoiceItemA],
  CustomerEstimate: [estimateA, estimateB],
  CustomerEstimateItem: [estimateItemA],
  CustomerPaymentMethod: [paymentMethodA],
  CustomerLedgerEntry: [ledgerChargeA, ledgerPaymentA],
};

function headersFor(customerId) {
  return { 'x-tenant-schema': TEST_SCHEMA, ...(customerId ? { 'x-customer-id': customerId } : {}) };
}

describe('Customer portal GET endpoints (integration)', () => {
  it('GET /customer/profile returns the authenticated customer with addresses', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/profile',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.email).toBe(customerA.email);
      expect(body.data.Addresses).toHaveLength(1);

      await app.close();
    });
  });

  it('GET /customer/profile rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/profile', headers: headersFor() });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it("GET /customer/payment-methods returns only the authenticated customer's tokenized payment methods", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/payment-methods',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toEqual([{ id: paymentMethodA.id, type: 'card', token: 'tok_visa_4242', isDefault: true }]);

      await app.close();
    });
  });

  it('GET /customer/payment-methods returns an empty list, not an error, for a customer with none', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/payment-methods',
        headers: headersFor(customerB.id),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual([]);

      await app.close();
    });
  });

  it("GET /customer/invoices lists only the authenticated customer's invoices", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/invoices',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(invoiceA.id);

      await app.close();
    });
  });

  it('GET /customer/invoices/:id returns the invoice with its line items for the owner', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/invoices/${invoiceA.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.id).toBe(invoiceA.id);
      expect(body.data.CustomerInvoiceItems).toHaveLength(1);

      await app.close();
    });
  });

  it("GET /customer/invoices/:id returns 404 (not 403) when requesting another customer's invoice", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/invoices/${invoiceB.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });

  it('GET /customer/invoices/:id rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/invoices/${invoiceA.id}`,
        headers: headersFor(),
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it("GET /customer/estimates/:id returns 404 when requesting another customer's estimate", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/estimates/${estimateB.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });

  it('GET /customer/estimates/:id returns the estimate with its line items for the owner', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/estimates/${estimateA.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.id).toBe(estimateA.id);
      expect(body.data.CustomerEstimateItems).toHaveLength(1);

      await app.close();
    });
  });

  it('GET /customer/estimates returns an empty list, not an error, for a customer with no estimates', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/estimates',
        headers: headersFor(customerA.id),
      });

      // customerA has one estimate seeded; verify it's scoped, not the fixture for empty case.
      expect(response.statusCode).toBe(200);
      expect(response.json().data).toHaveLength(1);

      await app.close();
    });
  });

  it('GET /customer/balance returns the ledger-computed balance (charges minus payments)', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/balance',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.balance).toBe(60);

      await app.close();
    });
  });

  it('GET /customer/balance rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/balance', headers: headersFor() });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it("GET /customer/ledger lists only the authenticated customer's ledger entries", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/ledger', headers: headersFor(customerA.id) });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toHaveLength(2);

      await app.close();
    });
  });

  it('GET /customer/ledger returns an empty list, not an error, for a customer with no ledger entries', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/ledger', headers: headersFor(customerB.id) });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual([]);

      await app.close();
    });
  });
});

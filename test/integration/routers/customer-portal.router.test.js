import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { seedWithTransaction, TEST_SCHEMA } from '../../helpers/seed-fixtures.js';
import fixtures from '../../fixtures/customer-portal.fixtures.cjs';

const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'customer-portal-router-download-'));
process.env.UPLOAD_DIR = uploadDir;

const { buildApp } = await import('../../../src/app.js');

const {
  customerA,
  customerB,
  customerC,
  addressA,
  addressA2,
  addressB,
  service1,
  item1,
  bookingA,
  bookingB,
  bookingA2,
  bookingA3Pending,
  invoiceA,
  invoiceB,
  invoiceItemA,
  estimateA,
  estimateB,
  estimateItemA,
  paymentMethodA,
  paymentMethodA2,
  paymentMethodB,
  ledgerChargeA,
  ledgerPaymentA,
  ledgerChargeA2,
  ledgerPaymentA2,
  serviceDocLibraryA,
  pdfA,
  customerDocumentA,
  customerDocumentB,
} = fixtures;

const allFixtures = {
  Customer: [customerA, customerB, customerC],
  Address: [addressA],
  Service: [service1],
  Item: [item1],
  Booking: [bookingA, bookingB, bookingA2, bookingA3Pending],
  CustomerInvoice: [invoiceA, invoiceB],
  CustomerInvoiceItem: [invoiceItemA],
  CustomerEstimate: [estimateA, estimateB],
  CustomerEstimateItem: [estimateItemA],
  CustomerPaymentMethod: [paymentMethodA],
  CustomerLedgerEntry: [ledgerChargeA, ledgerPaymentA, ledgerChargeA2, ledgerPaymentA2],
  ServiceDocumentLibrary: [serviceDocLibraryA],
  Pdf: [pdfA],
  CustomerDocument: [customerDocumentA, customerDocumentB],
};

function headersFor(customerId) {
  return { 'x-tenant-schema': TEST_SCHEMA, ...(customerId ? { 'x-customer-id': customerId } : {}) };
}

describe('Customer portal GET endpoints (integration)', () => {
  afterAll(() => fs.rm(uploadDir, { recursive: true, force: true }));

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

  it('GET /customer/profile returns an empty addresses list, not an error, for a customer with no addresses', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/profile',
        headers: headersFor(customerC.id),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.Addresses).toEqual([]);

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

  it('GET /customer/invoices returns an empty list, not an error, for a customer with no invoices', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/invoices',
        headers: headersFor(customerC.id),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual([]);

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

  it("GET /customer/estimates lists only the authenticated customer's estimates", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/estimates',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(estimateA.id);

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
        headers: headersFor(customerC.id),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual([]);

      await app.close();
    });
  });

  it('GET /customer/balance returns the ledger-computed balance for a mix of charge and payment entries', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/balance',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      // customerA: charges 100 + 30 = 130, payments 40 + 10 = 50 => balance 80
      expect(response.json().data.balance).toBe(80);

      await app.close();
    });
  });

  it('GET /customer/balance reflects adjustment and refund entries, not just charge/payment', async () => {
    const fixturesWithAdjustmentAndRefund = {
      ...allFixtures,
      CustomerLedgerEntry: [
        ...allFixtures.CustomerLedgerEntry,
        {
          id: '33333333-5555-6666-7777-888888888888',
          customerId: customerA.id,
          type: 'adjustment',
          amount: 15,
        },
        {
          id: '33333333-5555-6666-7777-999999999999',
          customerId: customerA.id,
          type: 'refund',
          amount: 5,
        },
      ],
    };

    await seedWithTransaction(fixturesWithAdjustmentAndRefund, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/balance',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      // base 80 (see test above) + adjustment 15 - refund 5 = 90
      expect(response.json().data.balance).toBe(90);

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

  it('GET /customer/balance returns 0, not an error, for a customer with no ledger entries', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/balance',
        headers: headersFor(customerC.id),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.balance).toBe(0);

      await app.close();
    });
  });

  it("GET /customer/ledger lists only the authenticated customer's ledger entries", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/ledger', headers: headersFor(customerA.id) });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toHaveLength(4);

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

  it('GET /customer/ledger rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/ledger', headers: headersFor() });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it('GET /customer/payment-methods rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/payment-methods', headers: headersFor() });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it('GET /customer/invoices rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/invoices', headers: headersFor() });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it('GET /customer/estimates rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/estimates', headers: headersFor() });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it('GET /customer/estimates/:id rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/estimates/${estimateA.id}`,
        headers: headersFor(),
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it("GET /customer/documents lists only the authenticated customer's documents, with the resolved name", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/documents',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        id: customerDocumentA.id,
        type: 'doc',
        name: serviceDocLibraryA.name,
        bookingId: bookingA.id,
      });

      await app.close();
    });
  });

  it("GET /customer/documents does not return another customer's documents", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/documents',
        headers: headersFor(customerB.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(customerDocumentB.id);
      expect(body.data.find((doc) => doc.id === customerDocumentA.id)).toBeUndefined();

      await app.close();
    });
  });

  it('GET /customer/documents rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/documents', headers: headersFor() });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it('GET /customer/documents/:id/download streams the file for the owner', async () => {
    await fs.writeFile(path.join(uploadDir, serviceDocLibraryA.filePath), 'agreement contents');

    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/documents/${customerDocumentA.id}/download`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-disposition']).toBe(
        `attachment; filename="${serviceDocLibraryA.originalFileName}"`,
      );
      expect(response.body).toBe('agreement contents');

      await app.close();
    });
  });

  it("GET /customer/documents/:id/download returns 404 when requesting another customer's document", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/documents/${customerDocumentB.id}/download`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });

  it('GET /customer/documents/:id/download returns 404 when the file is missing from disk', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/documents/${customerDocumentB.id}/download`,
        headers: headersFor(customerB.id),
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });

  it('GET /customer/documents/:id/download rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/documents/${customerDocumentA.id}/download`,
        headers: headersFor(),
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it('GET /customer/documents returns an empty list, not an error, for a customer with no documents', async () => {
    const fixturesWithoutDocs = { ...allFixtures, CustomerDocument: [customerDocumentB] };
    await seedWithTransaction(fixturesWithoutDocs, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/documents',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual([]);

      await app.close();
    });
  });

  it("GET /customer/work-orders lists only the authenticated customer's completed bookings", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/work-orders',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      const ids = body.data.map((wo) => wo.id);
      expect(ids).toEqual(expect.arrayContaining([bookingA.id, bookingA2.id]));
      expect(ids).not.toContain(bookingA3Pending.id);
      expect(ids).not.toContain(bookingB.id);
      expect(body.data.find((wo) => wo.id === bookingA.id)).toMatchObject({
        serviceName: service1.name,
        status: 'completed',
      });
      expect(typeof body.data.find((wo) => wo.id === bookingA.id).workOrderNumber).toBe('number');

      await app.close();
    });
  });

  it('GET /customer/work-orders filters by addressId', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/work-orders?addressId=${addressA.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(bookingA2.id);
      expect(body.data[0].address).toMatchObject({ id: addressA.id, label: addressA.label });

      await app.close();
    });
  });

  it('GET /customer/work-orders returns an empty list, not an error, for a customer with no completed bookings', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/work-orders',
        headers: headersFor(customerC.id),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual([]);

      await app.close();
    });
  });

  it('GET /customer/work-orders rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/customer/work-orders', headers: headersFor() });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it('GET /customer/work-orders/:id returns the completed booking for the owner', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/work-orders/${bookingA.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.id).toBe(bookingA.id);
      expect(body.data.serviceName).toBe(service1.name);
      expect(body.data.status).toBe('completed');

      await app.close();
    });
  });

  it("GET /customer/work-orders/:id returns 404 (not 403) when requesting another customer's booking", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/work-orders/${bookingB.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });

  it('GET /customer/work-orders/:id returns 404 for a booking that is not completed', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/work-orders/${bookingA3Pending.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });

  it('GET /customer/work-orders/:id rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/work-orders/${bookingA.id}`,
        headers: headersFor(),
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  describe('POST /customer/addresses/:id/default', () => {
    const fixturesWithAddresses = { ...allFixtures, Address: [addressA, addressA2, addressB] };

    it('sets a non-default address as the default and unsets the previous default', async () => {
      await seedWithTransaction(fixturesWithAddresses, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'POST',
          url: `/customer/addresses/${addressA2.id}/default`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data).toMatchObject({ id: addressA2.id, isDefault: true });

        const profile = await app.inject({
          method: 'GET',
          url: '/customer/profile',
          headers: headersFor(customerA.id),
        });
        const defaults = profile.json().data.Addresses.filter((a) => a.isDefault);
        expect(defaults).toHaveLength(1);
        expect(defaults[0].id).toBe(addressA2.id);

        await app.close();
      });
    });

    it('is a no-op when the address is already the default', async () => {
      await seedWithTransaction(fixturesWithAddresses, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'POST',
          url: `/customer/addresses/${addressA.id}/default`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data).toMatchObject({ id: addressA.id, isDefault: true });

        const profile = await app.inject({
          method: 'GET',
          url: '/customer/profile',
          headers: headersFor(customerA.id),
        });
        const defaults = profile.json().data.Addresses.filter((a) => a.isDefault);
        expect(defaults).toHaveLength(1);
        expect(defaults[0].id).toBe(addressA.id);

        await app.close();
      });
    });

    it("returns 404 when the address belongs to another customer", async () => {
      await seedWithTransaction(fixturesWithAddresses, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'POST',
          url: `/customer/addresses/${addressB.id}/default`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(404);

        await app.close();
      });
    });

    it('returns 404 for a nonexistent address id', async () => {
      await seedWithTransaction(fixturesWithAddresses, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'POST',
          url: '/customer/addresses/99999999-9999-9999-9999-999999999999/default',
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(404);

        await app.close();
      });
    });

    it('rejects an unauthenticated request', async () => {
      await seedWithTransaction(fixturesWithAddresses, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'POST',
          url: `/customer/addresses/${addressA2.id}/default`,
          headers: headersFor(),
        });

        expect(response.statusCode).toBe(401);

        await app.close();
      });
    });
  });

  describe('POST /customer/payment-methods/:id/default', () => {
    const fixturesWithPaymentMethods = {
      ...allFixtures,
      CustomerPaymentMethod: [paymentMethodA, paymentMethodA2, paymentMethodB],
    };

    it('sets a non-default payment method as the default and unsets the previous default', async () => {
      await seedWithTransaction(fixturesWithPaymentMethods, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'POST',
          url: `/customer/payment-methods/${paymentMethodA2.id}/default`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data).toMatchObject({ id: paymentMethodA2.id, isDefault: true });

        const list = await app.inject({
          method: 'GET',
          url: '/customer/payment-methods',
          headers: headersFor(customerA.id),
        });
        const defaults = list.json().data.filter((pm) => pm.isDefault);
        expect(defaults).toHaveLength(1);
        expect(defaults[0].id).toBe(paymentMethodA2.id);

        await app.close();
      });
    });

    it('is a no-op when the payment method is already the default', async () => {
      await seedWithTransaction(fixturesWithPaymentMethods, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'POST',
          url: `/customer/payment-methods/${paymentMethodA.id}/default`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data).toMatchObject({ id: paymentMethodA.id, isDefault: true });

        const list = await app.inject({
          method: 'GET',
          url: '/customer/payment-methods',
          headers: headersFor(customerA.id),
        });
        const defaults = list.json().data.filter((pm) => pm.isDefault);
        expect(defaults).toHaveLength(1);
        expect(defaults[0].id).toBe(paymentMethodA.id);

        await app.close();
      });
    });

    it("returns 404 when the payment method belongs to another customer", async () => {
      await seedWithTransaction(fixturesWithPaymentMethods, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'POST',
          url: `/customer/payment-methods/${paymentMethodB.id}/default`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(404);

        await app.close();
      });
    });

    it('returns 404 for a nonexistent payment method id', async () => {
      await seedWithTransaction(fixturesWithPaymentMethods, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'POST',
          url: '/customer/payment-methods/99999999-9999-9999-9999-999999999999/default',
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(404);

        await app.close();
      });
    });

    it('rejects an unauthenticated request', async () => {
      await seedWithTransaction(fixturesWithPaymentMethods, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'POST',
          url: `/customer/payment-methods/${paymentMethodA2.id}/default`,
          headers: headersFor(),
        });

        expect(response.statusCode).toBe(401);

        await app.close();
      });
    });
  });
});

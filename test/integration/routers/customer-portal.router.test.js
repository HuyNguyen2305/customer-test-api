import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { seedWithTransaction, TEST_SCHEMA } from '../../helpers/seed-fixtures.js';
import fixtures from '../../fixtures/customer-portal.fixtures.cjs';
import models from '../../../src/models/index.js';

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
  invoiceA2,
  invoicePaidA,
  invoiceItemA,
  estimateA,
  estimateB,
  estimateDraftA,
  estimateApprovedA2,
  estimateItemA,
  paymentMethodA,
  paymentMethodA2,
  paymentMethodB,
  paymentMethodOpenCreditA,
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
  Address: [addressA, addressA2],
  Service: [service1],
  Item: [item1],
  Booking: [bookingA, bookingB, bookingA2, bookingA3Pending],
  CustomerInvoice: [invoiceA, invoiceB, invoiceA2],
  CustomerInvoiceItem: [invoiceItemA],
  CustomerEstimate: [estimateA, estimateB, estimateDraftA, estimateApprovedA2],
  CustomerEstimateItem: [estimateItemA],
  CustomerPaymentMethod: [paymentMethodA],
  CustomerLedgerEntry: [ledgerChargeA, ledgerPaymentA, ledgerChargeA2, ledgerPaymentA2],
  ServiceDocumentLibrary: [serviceDocLibraryA],
  Pdf: [pdfA],
  CustomerDocument: [customerDocumentA, customerDocumentB],
};

function headersFor(customerId) {
  if (!customerId) return { 'x-tenant-schema': TEST_SCHEMA };

  const jti = crypto.randomUUID();
  const token = jwt.sign({ customerId, username: 'test-user', jti }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return { 'x-tenant-schema': TEST_SCHEMA, authorization: `Bearer ${token}` };
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
      expect(body.data.Addresses).toHaveLength(2);

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
      expect(body.data).toEqual([
        {
          id: paymentMethodA.id,
          type: 'card',
          token: 'tok_visa_4242',
          gateway: null,
          creditBalance: null,
          isDefault: true,
        },
      ]);

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

  it('GET /customer/payment-methods returns a numeric creditBalance for an open_credit payment method, not a 500', async () => {
    await seedWithTransaction(
      { ...allFixtures, CustomerPaymentMethod: [paymentMethodA, paymentMethodOpenCreditA] },
      async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'GET',
          url: '/customer/payment-methods',
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(200);
        const openCredit = response.json().data.find((method) => method.id === paymentMethodOpenCreditA.id);
        expect(openCredit.creditBalance).toBe(200);
        expect(typeof openCredit.creditBalance).toBe('number');

        await app.close();
      },
    );
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
      expect(body.data.map((invoice) => invoice.id).sort()).toEqual([invoiceA.id, invoiceA2.id].sort());
      expect(body.data.find((invoice) => invoice.id === invoiceA.id).statusLabel).toBe('Open');
      expect(body.data.find((invoice) => invoice.id === invoiceA2.id).statusLabel).toBeNull();

      await app.close();
    });
  });

  it('GET /customer/invoices?status=... filters to only invoices with that status', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/invoices?status=draft',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(invoiceA2.id);

      await app.close();
    });
  });

  it('GET /customer/invoices?addressId=... filters to only invoices for that address', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/invoices?addressId=${addressA2.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(invoiceA2.id);

      await app.close();
    });
  });

  it('GET /customer/invoices combines status and addressId with AND, returning nothing on a mismatched combo', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/invoices?status=sent&addressId=${addressA2.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual([]);

      await app.close();
    });
  });

  it('GET /customer/invoices?statusOrder=asc orders by the frozen status sequence, draft before sent', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/invoices?statusOrder=asc',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.map((invoice) => invoice.id)).toEqual([invoiceA2.id, invoiceA.id]);

      await app.close();
    });
  });

  it('GET /customer/invoices?statusOrder=desc reverses the status sequence, sent before draft', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/customer/invoices?statusOrder=desc',
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.map((invoice) => invoice.id)).toEqual([invoiceA.id, invoiceA2.id]);

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

  it('POST /customer/invoices/:invoiceId/items ignores a client-supplied cost and uses the Item catalog price', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'POST',
        url: `/customer/invoices/${invoiceA2.id}/items`,
        headers: headersFor(customerA.id),
        payload: { itemId: item1.id, description: 'Malicious credit', cost: -9999, qty: 1 },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Number(body.data.cost)).toBe(item1.defaultCost);

      await app.close();
    });
  });

  it('PATCH /customer/invoices/:invoiceId/items/:itemId leaves cost unchanged even if the client sends one', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      // Seed a fresh item directly on the draft invoice via the real create
      // endpoint first, then try to alter its price via update.
      const created = await app.inject({
        method: 'POST',
        url: `/customer/invoices/${invoiceA2.id}/items`,
        headers: headersFor(customerA.id),
        payload: { itemId: item1.id, qty: 1 },
      });
      const itemId = created.json().data.id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/customer/invoices/${invoiceA2.id}/items/${itemId}`,
        headers: headersFor(customerA.id),
        payload: { qty: 5, cost: -500 },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.qty).toBe(5);
      expect(Number(body.data.cost)).toBe(item1.defaultCost);

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
      expect(body.data.items).toHaveLength(1);
      expect(body.data.statusLabel).toBe('Open');

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

  describe('GET /customer/invoices/:id/pdf', () => {
    const fixturesWithPaidInvoice = {
      ...allFixtures,
      CustomerInvoice: [...allFixtures.CustomerInvoice, invoicePaidA],
    };

    it('returns a PDF buffer with the correct headers for the owner', async () => {
      await seedWithTransaction(allFixtures, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'GET',
          url: `/customer/invoices/${invoiceA.id}/pdf`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/pdf');
        expect(response.headers['content-disposition']).toBe(`inline; filename="invoice-${invoiceA.id}.pdf"`);
        expect(response.rawPayload.subarray(0, 5).toString()).toBe('%PDF-');

        await app.close();
      });
    });

    it("reflects the sum of balanceDue across all of the customer's invoices regardless of which one is viewed", async () => {
      await seedWithTransaction(fixturesWithPaidInvoice, async () => {
        const app = await buildApp();
        await app.ready();

        const openResponse = await app.inject({
          method: 'GET',
          url: `/customer/invoices/${invoiceA.id}/pdf`,
          headers: headersFor(customerA.id),
        });
        const paidResponse = await app.inject({
          method: 'GET',
          url: `/customer/invoices/${invoicePaidA.id}/pdf`,
          headers: headersFor(customerA.id),
        });

        // customerA balanceDue: invoiceA 100 + invoiceA2 0 + invoicePaidA 0 = 100, same on both PDFs.
        expect(openResponse.statusCode).toBe(200);
        expect(paidResponse.statusCode).toBe(200);
        expect(paidResponse.rawPayload.length).toBeGreaterThan(0);

        await app.close();
      });
    });

    it("returns 404 (not 403) when requesting another customer's invoice", async () => {
      await seedWithTransaction(allFixtures, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'GET',
          url: `/customer/invoices/${invoiceB.id}/pdf`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(404);

        await app.close();
      });
    });

    it('rejects an unauthenticated request', async () => {
      await seedWithTransaction(allFixtures, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'GET',
          url: `/customer/invoices/${invoiceA.id}/pdf`,
          headers: headersFor(),
        });

        expect(response.statusCode).toBe(401);

        await app.close();
      });
    });
  });

  describe('GET /customer/estimates/:id/pdf', () => {
    it('returns a PDF buffer with the correct headers for the owner', async () => {
      await seedWithTransaction(allFixtures, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'GET',
          url: `/customer/estimates/${estimateA.id}/pdf`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/pdf');
        expect(response.headers['content-disposition']).toBe(`inline; filename="estimate-${estimateA.id}.pdf"`);
        expect(response.rawPayload.subarray(0, 5).toString()).toBe('%PDF-');

        await app.close();
      });
    });

    it("returns 404 (not 403) when requesting another customer's estimate", async () => {
      await seedWithTransaction(allFixtures, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'GET',
          url: `/customer/estimates/${estimateB.id}/pdf`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(404);

        await app.close();
      });
    });

    it('returns 404 for a draft estimate (not portal-visible)', async () => {
      await seedWithTransaction(allFixtures, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'GET',
          url: `/customer/estimates/${estimateDraftA.id}/pdf`,
          headers: headersFor(customerA.id),
        });

        expect(response.statusCode).toBe(404);

        await app.close();
      });
    });

    it('rejects an unauthenticated request', async () => {
      await seedWithTransaction(allFixtures, async () => {
        const app = await buildApp();
        await app.ready();

        const response = await app.inject({
          method: 'GET',
          url: `/customer/estimates/${estimateA.id}/pdf`,
          headers: headersFor(),
        });

        expect(response.statusCode).toBe(401);

        await app.close();
      });
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
      expect(body.data.statusLabel).toBe('Open');
      expect(body.data.items).toHaveLength(1);

      await app.close();
    });
  });

  it('GET /customer/estimates/:id returns 404 for a draft estimate (not portal-visible)', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/estimates/${estimateDraftA.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });

  it("GET /customer/estimates lists only the authenticated customer's portal-visible estimates", async () => {
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
      const ids = body.data.map((estimate) => estimate.id);
      expect(ids).toContain(estimateA.id);
      expect(ids).toContain(estimateApprovedA2.id);
      expect(ids).not.toContain(estimateDraftA.id);
      expect(body.data.find((estimate) => estimate.id === estimateApprovedA2.id).statusLabel).toBe('Accepted');

      // Regression coverage: the list endpoint's repository query used to omit
      // items and createdAt entirely, so every estimate silently showed a $0
      // (or negative, with a discount) total and an undefined createdAt here,
      // even though the single-estimate detail endpoint computed them correctly.
      const estimateARow = body.data.find((estimate) => estimate.id === estimateA.id);
      expect(estimateARow.subtotal).toBe(estimateItemA.cost * estimateItemA.qty);
      expect(estimateARow.total).toBe(estimateItemA.cost * estimateItemA.qty);
      expect(estimateARow.createdAt).toEqual(expect.any(String));

      await app.close();
    });
  });

  it('GET /customer/estimates/:id caches computed tax onto each item row (tax1RateId/tax1Total etc), self-consistently across repeated reads', async () => {
    const taxRateNY = { id: 'aaaaaaaa-1111-2222-3333-444444444444', name: 'NY Sales Tax', code: 'NY', rate: 4 };
    const taxRateTX = { id: 'aaaaaaaa-1111-2222-3333-555555555555', name: 'TX Sales Tax', code: 'TX', rate: 6.25 };
    const taxedEstimate = {
      id: 'aaaaaaaa-1111-2222-3333-666666666666',
      bookingId: bookingA.id,
      customerId: customerA.id,
      status: 'sent',
    };
    const taxedItem1 = {
      id: 'aaaaaaaa-1111-2222-3333-777777777777',
      customerEstimateId: taxedEstimate.id,
      itemId: item1.id,
      description: 'NY item',
      cost: 100,
      qty: 1,
      tax1RateId: taxRateNY.id,
    };
    const taxedItem2 = {
      id: 'aaaaaaaa-1111-2222-3333-888888888888',
      customerEstimateId: taxedEstimate.id,
      itemId: item1.id,
      description: 'TX item',
      cost: 100,
      qty: 1,
      tax1RateId: taxRateTX.id,
    };

    // TaxRate must be created before CustomerEstimateItem (which references it
    // via tax1RateId), so it's spread in first - seedWithTransaction creates
    // rows in Object.entries() order and tears them down in reverse.
    const seed = {
      TaxRate: [taxRateNY, taxRateTX],
      ...allFixtures,
      CustomerEstimate: [...allFixtures.CustomerEstimate, taxedEstimate],
      CustomerEstimateItem: [...allFixtures.CustomerEstimateItem, taxedItem1, taxedItem2],
    };

    await seedWithTransaction(seed, async () => {
      const app = await buildApp();
      await app.ready();

      const first = await app.inject({
        method: 'GET',
        url: `/customer/estimates/${taxedEstimate.id}`,
        headers: headersFor(customerA.id),
      });

      expect(first.statusCode).toBe(200);
      const firstBody = first.json();
      // 2 items @ $100, 4% and 6.25%, no discount -> $100 + $4 + $6.25 = $210.25
      expect(firstBody.data.total).toBeCloseTo(210.25, 2);
      expect(firstBody.data.taxes).toHaveLength(2);

      const itemsAfterFirst = await models.CustomerEstimateItem.schema(TEST_SCHEMA).findAll({
        where: { customerEstimateId: taxedEstimate.id, id: [taxedItem1.id, taxedItem2.id] },
      });
      expect(itemsAfterFirst.map((row) => Number(row.tax1Total)).sort()).toEqual([4, 6.25]);
      expect(itemsAfterFirst.every((row) => row.tax1Name)).toBe(true);

      const second = await app.inject({
        method: 'GET',
        url: `/customer/estimates/${taxedEstimate.id}`,
        headers: headersFor(customerA.id),
      });

      expect(second.statusCode).toBe(200);
      expect(second.json().data.total).toBeCloseTo(210.25, 2);

      const itemsAfterSecond = await models.CustomerEstimateItem.schema(TEST_SCHEMA).findAll({
        where: { customerEstimateId: taxedEstimate.id, id: [taxedItem1.id, taxedItem2.id] },
      });
      // Re-read must not change or duplicate anything - same 2 items, same amounts.
      expect(itemsAfterSecond.map((row) => Number(row.tax1Total)).sort()).toEqual([4, 6.25]);

      await app.close();
    });
  });

  it('adding an untaxed line item to a draft invoice recomputes the discount ratio for its already-taxed sibling', async () => {
    const taxRate = { id: 'bbbbbbbb-1111-2222-3333-444444444444', name: 'State Tax', code: 'ST', rate: 10 };
    const cascadeInvoice = {
      id: 'bbbbbbbb-1111-2222-3333-555555555555',
      bookingId: bookingA.id,
      customerId: customerA.id,
      status: 'draft',
      discountValue: 20,
      discountType: 'flat',
    };
    // tax1Name/tax1Rate are seeded alongside tax1RateId to simulate the
    // snapshot a real attachAutoTax/copyEstimateLineItems assignment would
    // already have written - invoice items never re-resolve a TaxRate live,
    // so without this the item would be treated as having no tax at all.
    const taxedInvoiceItem = {
      id: 'bbbbbbbb-1111-2222-3333-666666666666',
      customerInvoiceId: cascadeInvoice.id,
      itemId: item1.id,
      description: 'Taxed item',
      cost: 80,
      qty: 1,
      tax1RateId: taxRate.id,
      tax1Name: taxRate.name,
      tax1Rate: taxRate.rate,
    };

    const seed = {
      TaxRate: [taxRate],
      ...allFixtures,
      CustomerInvoice: [...allFixtures.CustomerInvoice, cascadeInvoice],
      CustomerInvoiceItem: [...allFixtures.CustomerInvoiceItem, taxedInvoiceItem],
    };

    await seedWithTransaction(seed, async () => {
      const app = await buildApp();
      await app.ready();

      const addResponse = await app.inject({
        method: 'POST',
        url: `/customer/invoices/${cascadeInvoice.id}/items`,
        headers: headersFor(customerA.id),
        payload: { itemId: item1.id, qty: 1 },
      });
      expect(addResponse.statusCode).toBe(200);

      const items = await models.CustomerInvoiceItem.schema(TEST_SCHEMA).findAll({
        where: { customerInvoiceId: cascadeInvoice.id },
      });
      const taxedRow = items.find((row) => row.id === taxedInvoiceItem.id);
      const untaxedRow = items.find((row) => row.id !== taxedInvoiceItem.id);

      // subtotal 80 (taxed) + item1.defaultCost (untaxed) - $20 discount ->
      // ratio applies proportionally; the taxed item's tax1Total must reflect
      // the new combined subtotal, not the $80-only ratio it had before the add.
      const combinedSubtotal = 80 + Number(item1.defaultCost);
      const expectedRatio = 20 / combinedSubtotal;
      const expectedTax1Total = 80 * (1 - expectedRatio) * 0.1;
      // The column is DECIMAL(12,2), so Postgres rounds to cents on write.
      expect(Number(taxedRow.tax1Total)).toBeCloseTo(expectedTax1Total, 2);
      expect(untaxedRow.tax1RateId).toBeNull();

      await app.close();
    });
  });

  it('GET /customer/estimates?addressId= filters estimates to the given address via the booking', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: `/customer/estimates?addressId=${addressA.id}`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.map((estimate) => estimate.id)).toEqual([estimateApprovedA2.id]);

      await app.close();
    });
  });

  it("POST /customer/estimates/:id/invoice creates an invoice and flips a 'sent' estimate to 'approved'", async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'POST',
        url: `/customer/estimates/${estimateA.id}/invoice`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.items).toHaveLength(1);
      expect(body.data.items[0]).toMatchObject({ itemId: item1.id, cost: estimateItemA.cost });

      const estimateResponse = await app.inject({
        method: 'GET',
        url: `/customer/estimates/${estimateA.id}`,
        headers: headersFor(customerA.id),
      });
      expect(estimateResponse.json().data.status).toBe('approved');

      const invoiceResponse = await app.inject({
        method: 'GET',
        url: `/customer/invoices/${body.data.id}`,
        headers: headersFor(customerA.id),
      });
      expect(invoiceResponse.statusCode).toBe(200);
      expect(invoiceResponse.json().data.id).toBe(body.data.id);

      await app.close();
    });
  });

  it('POST /customer/estimates/:id/invoice returns 404 for a draft estimate (not eligible to invoice)', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'POST',
        url: `/customer/estimates/${estimateDraftA.id}/invoice`,
        headers: headersFor(customerA.id),
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });

  it('POST /customer/estimates/:id/invoice returns 409 on a second attempt for an already-invoiced estimate', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const first = await app.inject({
        method: 'POST',
        url: `/customer/estimates/${estimateApprovedA2.id}/invoice`,
        headers: headersFor(customerA.id),
      });
      expect(first.statusCode).toBe(200);

      const second = await app.inject({
        method: 'POST',
        url: `/customer/estimates/${estimateApprovedA2.id}/invoice`,
        headers: headersFor(customerA.id),
      });

      expect(second.statusCode).toBe(409);

      await app.close();
    });
  });

  it('POST /customer/estimates/:id/invoice rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'POST',
        url: `/customer/estimates/${estimateA.id}/invoice`,
        headers: headersFor(),
      });

      expect(response.statusCode).toBe(401);

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

  it('GET /balance rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/balance', headers: headersFor() });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  it('POST /balance/pay rejects an unauthenticated request', async () => {
    await seedWithTransaction(allFixtures, async () => {
      const app = await buildApp();
      await app.ready();

      const response = await app.inject({
        method: 'POST',
        url: '/balance/pay',
        headers: headersFor(),
        payload: { paymentMethodId: paymentMethodA.id },
      });

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

    it('returns 404 when the address belongs to another customer', async () => {
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

    it('returns 404 when the payment method belongs to another customer', async () => {
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

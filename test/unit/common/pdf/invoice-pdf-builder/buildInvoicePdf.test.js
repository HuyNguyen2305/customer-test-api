import { jest } from '@jest/globals';
import { FakePDFDocument, getLastFakePdfDocument } from '../../../../helpers/fake-pdf-document.js';

jest.unstable_mockModule('pdfkit', () => ({ default: FakePDFDocument }));

const { buildInvoicePdf } = await import('#common/pdf/invoice-pdf-builder.js');

const baseInvoiceData = {
  id: 'i1',
  status: 'sent',
  createdAt: '2026-08-12T00:00:00.000Z',
  addressLine1: 'Wall Street',
  addressLine2: null,
  addressCity: 'New York',
  addressState: 'NY',
  addressZip: '10005',
  subtotal: 65,
  total: 65,
  balanceDue: 65,
  termsText: null,
  notesText: null,
  items: [{ description: 'Bi-Monthly Service', cost: 65, qty: 1 }],
};

const branding = { companyName: 'Tho Dev', phone: '+11232412412', logoPlaceholderText: 'Replace logo' };
const customer = { id: 'c1', firstName: 'William', lastName: 'Saliba' };

describe('buildInvoicePdf', () => {
  it('resolves a Buffer', async () => {
    const result = await buildInvoicePdf(baseInvoiceData, { customer, accountBalance: 65, branding });
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('does not draw a PAID stamp for a non-paid invoice', async () => {
    await buildInvoicePdf(baseInvoiceData, { customer, accountBalance: 65, branding });

    const lastInstance = getLastFakePdfDocument();
    expect(lastInstance.textCalls).not.toContain('PAID');
    expect(lastInstance.moveToCalls.some(([, y]) => y === 32)).toBe(false);
  });

  it('draws a PAID stamp and top rule for a paid invoice', async () => {
    const paidInvoiceData = { ...baseInvoiceData, status: 'paid' };
    await buildInvoicePdf(paidInvoiceData, { customer, accountBalance: 65, branding });

    const lastInstance = getLastFakePdfDocument();
    expect(lastInstance.textCalls).toContain('PAID');
    expect(lastInstance.moveToCalls.some(([, y]) => y === 32)).toBe(true);
  });

  it('renders totals from the invoice and the passed-in cross-invoice account balance', async () => {
    const invoiceData = { ...baseInvoiceData, total: 65, balanceDue: 65 };
    await buildInvoicePdf(invoiceData, { customer, accountBalance: 130, branding });

    // Amount Paid = total - balanceDue = 0; Amount Due = balanceDue = 65;
    // Account Balance / Balance Due use the passed-in aggregate (130), not the single invoice.
    const lastInstance = getLastFakePdfDocument();
    expect(lastInstance.textCalls).toContain('$0.00');
    expect(lastInstance.textCalls.filter((t) => t === '$65.00').length).toBeGreaterThanOrEqual(1);
    expect(lastInstance.textCalls.filter((t) => t === '$130.00').length).toBe(2);
  });

  it('does not throw with empty items and null terms/notes', async () => {
    const emptyInvoiceData = { ...baseInvoiceData, items: [], termsText: null, notesText: null };
    await expect(buildInvoicePdf(emptyInvoiceData, { customer, accountBalance: 0, branding })).resolves.toBeInstanceOf(
      Buffer,
    );
  });
});

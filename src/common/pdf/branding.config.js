// Static placeholder branding for v1 — no Company/Tenant-settings model
// exists in this schema yet. Swap for DB-driven values once one does.
export const branding = {
  companyName: process.env.INVOICE_PDF_COMPANY_NAME || 'Tho Dev',
  phone: process.env.INVOICE_PDF_COMPANY_PHONE || '',
  logoPlaceholderText: 'Replace logo in your settings',
};

export default branding;

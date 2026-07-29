# src/schemas

Request/response validation schemas that power Swagger, consumed by routers.

## Convention
- File: `<domain>.schema.js`, one named export per controller method, named
  `<methodName>Schema` (e.g. `listInvoicesSchema` for
  `InvoiceController.listInvoices`) — naming maps 1:1 to controller methods.

## Current state
Every schema is currently an empty object export (e.g.
`export const listInvoicesSchema = {};`). No JSON-schema shape or
fluent-json-schema usage exists yet, so the exact validation format is
unresolved — don't assume a shape; check `package.json` dependencies and
whatever router/schema pair is implemented first before inventing a pattern.

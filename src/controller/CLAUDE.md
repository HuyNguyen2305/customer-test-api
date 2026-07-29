# src/controller

HTTP orchestration only — no business logic. One controller per domain.

## Convention
- File: `<domain>.controller.js`, class `XController { methodName() {} }`,
  default export.
- DI: `CONTROLLER_KEYS` (`#common/constants/singleton.js`) maps kebab filename
  to camelCase registration key; registered `asClass(XController).scoped()`
  in `container.js`. Under Awilix PROXY mode, the intended pattern is
  constructor injection of the matching service, e.g.
  `constructor({ invoiceService }) { this.invoiceService = invoiceService; }`.
- Success responses: `{ success: true, message, data }` via `reply.send(...)`.
- Errors: throw `CustomError` subclasses (from `#configs/error.js`) rather than
  handling them locally — a global handler in `src/app.js` catches them and
  replies `{ success: false, message }` using the error's `statusCode`
  (falls back to 500 for non-`CustomError` errors).

## Current state
Every controller method is currently an empty stub — no constructor,
no request-parsing, no `reply.send` call exists yet anywhere in this folder.
The patterns above come from the surrounding infra (`container.js`, `app.js`,
`configs/error.js`), not from a populated example.

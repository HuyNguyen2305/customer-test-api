# src/services

Business logic layer. Plain classes (no base class), one per domain, method
names mirror the sibling repository 1:1 (e.g. `WorkOrderService.listWorkOrders()`
/ `WorkOrderRepository.listWorkOrders()`).

## Convention
- File: `<domain>.service.js`, class `XService`, default export.
- DI: registered `asClass(XService).scoped()` under `SERVICE_KEYS.X_SERVICE`
  (`#common/constants/singleton.js`). Under Awilix PROXY mode, the intended
  constructor injection is destructuring repositories by camelCase key, e.g.
  `constructor({ workOrderRepository }) { this.workOrderRepository = workOrderRepository; }`.
- Business-logic errors belong here: throw `CustomError` subclasses from
  `#configs/error.js` (e.g. `throw new NotFoundError('Invoice not found')`) —
  controllers should not need to construct these themselves.

## Current state
Every service method body is currently an empty stub, and no file yet
constructs or throws a `CustomError`. There is no populated example to copy
from — the injection pattern above is inferred from `container.js`, not
demonstrated in a working service yet.

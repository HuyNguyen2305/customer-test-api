# src/configs

Only file: `error.js`.

## CustomError
`CustomError extends Error`, constructor `(message, statusCode = 500)`, sets
`this.name = this.constructor.name` and `this.statusCode = statusCode`.

## Subclasses (all in this file)
- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `ValidationError` (422)

Pattern: `class XxxError extends CustomError { constructor(message = 'default') { super(message, code); } }`.

## Usage contract
Services/controllers throw these directly, e.g.
`throw new NotFoundError('Invoice not found')`. A global handler in
`src/app.js` catches `CustomError` instances and replies
`{ success: false, message }` using `err.statusCode`; anything else falls
back to a 500. See `#controller` and `#services` CLAUDE.md files.

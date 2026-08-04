# Database Architecture Specification

### Service Templates, Booking, and Customer System

## Purpose of this document

This is a design specification for a database schema covering three connected systems:

1. **Service Templates** — configurable service definitions with recurrence rules, and optional attached Invoice, Estimate, Material, Document, and Todo List sub-features.
2. **Booking** — the system that connects a Customer to a Service at a specific time.
3. **Customer** — client records, including their own portal-facing Invoices, Estimates, Documents, Balance, and Payment Methods.

Use this document as the source of truth for table structure, relationships, and field types when generating migrations/schema. Where a design decision was left open (flagged below), ask before assuming.

---

## 1. Core table: `services`

The service catalog. Every booking, invoice, estimate, material list, document set, and todo list traces back to a service.

```
services
├── id                  PK
├── name                string
├── length_hours        int
├── length_minutes      int
├── color               string (hex)
├── job_cycle           int
├── set_to_confirmed    boolean          # each recurring job auto-set to "confirmed"
├── status              enum             # active | archived | deleted
├── created_at          timestamp
└── updated_at          timestamp
```

### `service_recurrences` (1:1 with `services`)

Holds the conditional recurrence logic. Kept as its own table because this exact shape is reused by `invoice_frequencies` later.

```
service_recurrences
├── id                    PK
├── service_id            FK -> services
├── repeat_type           enum        # off | daily | weekly | monthly | yearly
├── interval              int         # the "Every N" value
├── weekly_period_type    enum, null  # 1st_3rd | 2nd_4th | every
├── weekly_days           array/bitmask, null   # multi-select S M T W T F S
├── repeat_by             enum, null  # day_of_week | day_of_month | day_of_year
├── ends_type             enum        # never | after | on_date
├── ends_count            int, null
├── ends_date             date, null
├── except_type           enum        # off | month | condition
├── except_months         array, null # multi-select checkboxes (Jan-Dec)
├── except_ordinal        enum, null  # 1st | 2nd | 3rd | 4th | 5th | last
├── except_weekday        enum, null
└── except_unit           enum, null  # week | month
```

**Computed, not stored:** the "Summary" line (e.g. "Weekly on Tuesday, until 07/28/2026") is generated from the above fields at read-time, not persisted.

---

## 2. Invoice (1:1 with `services`)

```
invoices
├── id                    PK
├── service_id            FK -> services
├── repeats_with_job      boolean
├── discount_value        decimal
├── discount_type         enum        # percent | flat
├── terms_text            richtext
├── notes_text             richtext
├── terms_template_id     FK -> note_templates, null
└── notes_template_id     FK -> note_templates, null
```

```
invoice_items
├── id                    PK
├── invoice_id            FK -> invoices
├── item_id               FK -> items
├── description           text
├── cost                  decimal
├── tax_rate_id           FK -> tax_rates, null
├── qty                   int
├── is_one_time           boolean     # excludes this line from recurrence
└── sort_order            int
```

```
invoice_frequencies (1:1 with invoices)
├── id                    PK
├── invoice_id            FK -> invoices
├── repeat_type           enum        # repeat_with_job | weekly | monthly | yearly | does_not_repeat
├── interval              int
├── weekly_period_type    enum, null
├── weekly_days           array, null
├── repeat_by             enum, null
├── ends_type             enum        # never | after | on_date  (unit = "invoices")
├── ends_count            int, null
├── ends_date             date, null
├── invoice_date          date        # anchor date for schedule
└── action                enum        # none | send_email | send_email_cc | send_sms |
                                       # send_email_sms | charge_to | charge_to_send_receipt
```

---

## 3. Estimate (1:1 with `services`)

```
estimates
├── id                    PK
├── service_id            FK -> services
├── type                  enum        # basic | dynamic | package
├── template_id           FK -> estimate_templates, null
├── discount_value        decimal
├── discount_type         enum        # percent | flat
├── deposit_value         decimal
├── deposit_type          enum        # percent | flat
├── terms_text            richtext
├── notes_text            richtext
├── terms_template_id     FK -> note_templates, null
└── notes_template_id     FK -> note_templates, null
```

```
estimate_items                        # same shape as invoice_items, no is_one_time
├── id                    PK
├── estimate_id           FK -> estimates
├── item_id               FK -> items
├── description           text
├── cost                  decimal
├── tax_rate_id           FK -> tax_rates, null
├── qty                   int
└── sort_order            int
```

```
estimate_templates
├── id                    PK
├── name                  string
└── type                  enum        # basic | dynamic | package
```

---

## 4. Shared reference tables (used by Invoice + Estimate)

```
items                                  # master item/service-line catalog
├── id                    PK
├── name                  string
└── default_cost          decimal

note_templates                         # shared Terms/Notes template pool
├── id                    PK
├── name                  string
├── body                  richtext
├── category              enum   # customer_notes | estimate_notes | invoice_notes |
                                  # job_notes | top_notes | work_order_notes | payment_terms
└── is_default             boolean     # default flag, scoped per category
```

---

## 5. Material (1:many with `services`)

```
materials
├── id                    PK
├── service_id            FK -> services
├── material_id           FK -> materials_master   # the Material/EPA# dropdown
├── units_value            decimal
├── units_type_id          FK -> unit_types
├── dilution               text
├── method_id              FK -> application_methods, null
├── custom_material_id     FK -> custom_materials, null
├── location_id            FK -> locations, null
├── target_pest_id         FK -> pests, null
└── sort_order              int
```

Supporting lookup tables (simple `id` + `name`, low complexity, populate as static reference data): `materials_master`, `unit_types`, `application_methods`, `custom_materials`, `locations`, `pests`.

---

## 6. Document (many:many join, `services` ↔ shared docs library)

```
service_documents
├── id                    PK
├── service_id            FK -> services
├── document_id           FK -> documents, null   # if type = doc
├── pdf_id                FK -> pdfs, null         # if type = pdf
└── type                  enum        # doc | pdf
```

Actual file content lives in the pre-existing `documents` / `pdfs` library (managed elsewhere, e.g. a "Paperwork" module). This table is a pure link/reference, not a file store.

---

## 7. Todo List (1:many with `services`, each list has many todos)

```
todo_lists
├── id                    PK
├── service_id            FK -> services
├── name                  string
└── sort_order             int
```

```
todos
├── id                    PK
├── todo_list_id           FK -> todo_lists
├── text                   string
└── sort_order              int
```

**Note:** Both `materials` and `todo_lists` support a "sync to all active jobs" action in the UI. This implies job-level snapshot tables exist downstream (`job_materials`, `job_todo_lists`/`job_todos`) — see Open Questions below.

---

## 8. New core table: `customers`

```
customers
├── id                    PK
├── first_name            string
├── last_name             string
├── email                 string
├── address               string/text     # may need its own `addresses` table if multi-property
├── mobile                string
├── is_registered         boolean         # logged-in account vs guest/unregistered booking
├── password_hash         string, null    # only if registered
├── created_at            timestamp
└── updated_at             timestamp
```

---

## 9. `bookings` — join between `services` and `customers`

A booking is a real entity with its own attributes, not a pure pivot table.

```
bookings
├── id                    PK
├── service_id            FK -> services   # determines duration/type of service
├── customer_id           FK -> customers  # who placed it
├── start_time            datetime
├── end_time              datetime         # computed as start_time + service.length
├── status                enum             # pending | confirmed | completed | cancelled
├── created_at             timestamp
└── updated_at             timestamp
```

**Availability logic:** when a booking is being placed, the engine reads `services.length_hours` / `length_minutes` for the selected service to calculate valid open time slots against existing bookings/schedules. Admin views join back to `services.name` (and likely `services.color` for calendar rendering).

---

## 10. Customer-facing records (portal: Balance, Documents, Estimates, Invoices, Payment Methods)

> **⚠️ Open design decision — confirm before implementing this section.**
> There are two possible approaches:
>
> - **(A) Generated-copy model:** `invoices` / `estimates` / `documents` on `services` are templates. When a booking is placed, the system generates a _copy_ into customer-scoped tables (`customer_invoices`, `customer_estimates`, `customer_documents`), which are then independently editable per customer.
> - **(B) Direct-reference model:** no copying — the existing `invoices` / `estimates` / `documents` tables just gain a `booking_id` (and/or `customer_id`) column directly, and the portal filters those same rows.
>
> **(A) is specified below** since it matches the "service = template, booking = instance" pattern established throughout this document, but confirm with stakeholder before building.

```
customer_invoices
├── id                    PK
├── booking_id            FK -> bookings
├── customer_id           FK -> customers        # denormalized for fast portal lookup
├── source_invoice_id     FK -> invoices, null    # template it was generated from
├── discount_value        decimal
├── discount_type         enum
├── terms_text            richtext
├── notes_text            richtext
├── status                enum        # draft | sent | paid | overdue
└── balance_due            decimal

customer_invoice_items                 # same shape as invoice_items
├── id                    PK
├── customer_invoice_id   FK -> customer_invoices
├── item_id               FK -> items
├── description           text
├── cost                  decimal
├── tax_rate_id           FK -> tax_rates, null
├── qty                   int
└── sort_order              int

customer_estimates                     # same pattern as customer_invoices
├── id                    PK
├── booking_id            FK -> bookings
├── customer_id           FK -> customers
├── source_estimate_id    FK -> estimates, null
├── type                  enum
├── discount_value        decimal
├── discount_type         enum
├── deposit_value         decimal
├── deposit_type          enum
├── terms_text            richtext
├── notes_text            richtext
└── status                enum

customer_estimate_items                # same shape as estimate_items
├── id                    PK
├── customer_estimate_id  FK -> customer_estimates
├── item_id               FK -> items
├── description           text
├── cost                  decimal
├── tax_rate_id           FK -> tax_rates, null
├── qty                   int
└── sort_order              int

customer_documents
├── id                    PK
├── customer_id           FK -> customers
├── booking_id             FK -> bookings, null
├── document_id           FK -> documents, null
├── pdf_id                 FK -> pdfs, null
└── type                  enum        # doc | pdf

customer_ledger_entries                # audit-friendly running balance
├── id                    PK
├── customer_id           FK -> customers
├── type                  enum        # charge | payment | adjustment | refund
├── amount                decimal
├── reference_id          FK, null    # e.g. related invoice/payment
└── created_at             timestamp

customer_payment_methods
├── id                    PK
├── customer_id           FK -> customers
├── type                  enum        # card | bank | other
├── token                 string      # tokenized reference to payment processor only — never raw card data
└── is_default             boolean
```

**Balance** is computed (`SUM` over `customer_ledger_entries`), not a stored mutable field — this preserves audit history rather than overwriting a single running total.

---

## Relationship overview

```
services (1) ─┬─ (1) service_recurrences
               ├─ (1) invoices ── (many) invoice_items ── (ref) items
               │        └─ (1) invoice_frequencies
               ├─ (1) estimates ── (many) estimate_items ── (ref) items
               │        └─ (ref) estimate_templates
               ├─ (many) materials ── (ref lookup tables)
               ├─ (many) service_documents ── (ref) documents/pdfs
               └─ (many) todo_lists ── (many) todos

customers (1) ─┬─ (many) bookings ── (1) services
                ├─ (many) customer_invoices ── (many) customer_invoice_items
                │        └─ sourced from invoices (template)
                ├─ (many) customer_estimates ── (many) customer_estimate_items
                │        └─ sourced from estimates (template)
                ├─ (many) customer_documents
                ├─ (many) customer_ledger_entries   [balance]
                └─ (many) customer_payment_methods

note_templates (shared, filtered by category) ── referenced by invoices, estimates,
                                                   customer_invoices, customer_estimates
```

---

## Open questions to resolve before/during implementation

1. **Generated-copy vs direct-reference model** (see flag in Section 10) — determines whether `customer_invoices`/`customer_estimates`/`customer_documents` exist as separate tables or whether `booking_id`/`customer_id` are added directly to the template tables.
2. **Job-level snapshot tables** — do `materials` and `todo_lists` need parallel `job_materials` / `job_todo_lists` / `job_todos` tables to support the "sync to all active jobs" behavior seen in the UI? If yes, define their shape (likely identical to the template versions plus a `booking_id` or `job_id` FK and a `completed`/`status` field for todos).
3. **Addresses** — should `customers.address` remain a single field, or become its own `addresses` table (1:many) to support multiple service locations per customer?
4. **Estimate Dynamic/Package types** — `estimates.type` currently just stores the enum; if Dynamic/Package estimates have distinct sub-fields (beyond Basic), those aren't yet captured and will need their own table(s) once specified.
5. **Cascade/deletion rules** — since `services.status` includes `archived`/`deleted` states, and `services.id` is referenced by `bookings`, deletion should likely be soft (status flag) rather than a hard delete, to avoid breaking historical booking references.

---

## Suggested build order for Claude Code

1. `services` + `service_recurrences`
2. `items`, `note_templates`, `tax_rates` (shared reference tables first, since Invoice/Estimate depend on them)
3. `invoices` + `invoice_items` + `invoice_frequencies`
4. `estimates` + `estimate_items` + `estimate_templates`
5. Material lookup tables + `materials`
6. `documents`/`pdfs` (if not already existing) + `service_documents`
7. `todo_lists` + `todos`
8. `customers`
9. `bookings`
10. `customer_invoices` + `customer_invoice_items`, `customer_estimates` + `customer_estimate_items`, `customer_documents`, `customer_ledger_entries`, `customer_payment_methods`

Resolve Open Question #1 before starting step 10, since it changes the shape of everything in that step.

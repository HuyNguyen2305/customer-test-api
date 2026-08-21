import { DataTypes } from 'sequelize';
import { sequelize } from '#common/sequelize.js';

import defineBalance from './balance.model.js';
import defineService from './service.model.js';
import defineServiceRecurrence from './service-recurrence.model.js';
import defineItem from './item.model.js';
import defineNoteTemplate from './note-template.model.js';
import defineTaxRate from './tax-rate.model.js';
import defineServiceInvoice from './service-invoice.model.js';
import defineInvoiceItem from './invoice-item.model.js';
import defineInvoiceFrequency from './invoice-frequency.model.js';
import defineEstimateTemplate from './estimate-template.model.js';
import defineServiceEstimate from './service-estimate.model.js';
import defineServiceEstimateItem from './service-estimate-item.model.js';
import defineMaterialsMaster from './materials-master.model.js';
import defineUnitType from './unit-type.model.js';
import defineApplicationMethod from './application-method.model.js';
import defineLocation from './location.model.js';
import definePest from './pest.model.js';
import defineMaterial from './material.model.js';
import defineServiceDocumentLibrary from './service-document-library.model.js';
import definePdf from './pdf.model.js';
import defineTodoList from './todo-list.model.js';
import defineTodo from './todo.model.js';
import defineCustomer from './customer.model.js';
import defineRevokedToken from './revoked-token.model.js';
import defineBooking from './booking.model.js';
import defineAddress from './address.model.js';
import defineCustomerInvoice from './customer-invoice.model.js';
import defineCustomerEstimate from './customer-estimate.model.js';
import defineCustomerLineItem from './customer-line-item.model.js';
import defineCustomerDocument from './customer-document.model.js';
import defineCustomerLedgerEntry from './customer-ledger-entry.model.js';
import defineCustomerPaymentMethod from './customer-payment-method.model.js';

for (const define of [
  defineBalance,
  defineService,
  defineServiceRecurrence,
  defineItem,
  defineNoteTemplate,
  defineTaxRate,
  defineServiceInvoice,
  defineInvoiceItem,
  defineInvoiceFrequency,
  defineEstimateTemplate,
  defineServiceEstimate,
  defineServiceEstimateItem,
  defineMaterialsMaster,
  defineUnitType,
  defineApplicationMethod,
  defineLocation,
  definePest,
  defineMaterial,
  defineServiceDocumentLibrary,
  definePdf,
  defineTodoList,
  defineTodo,
  defineCustomer,
  defineRevokedToken,
  defineBooking,
  defineAddress,
  defineCustomerInvoice,
  defineCustomerEstimate,
  defineCustomerLineItem,
  defineCustomerDocument,
  defineCustomerLedgerEntry,
  defineCustomerPaymentMethod,
]) {
  define(sequelize, DataTypes);
}

const {
  Service,
  ServiceRecurrence,
  Item,
  NoteTemplate,
  TaxRate,
  ServiceInvoice,
  InvoiceItem,
  InvoiceFrequency,
  EstimateTemplate,
  ServiceEstimate,
  ServiceEstimateItem,
  MaterialsMaster,
  UnitType,
  ApplicationMethod,
  Location,
  Pest,
  Material,
  ServiceDocumentLibrary,
  Pdf,
  TodoList,
  Todo,
  Customer,
  Booking,
  Address,
  CustomerInvoice,
  CustomerEstimate,
  CustomerLineItem,
  CustomerDocument,
  CustomerLedgerEntry,
  CustomerPaymentMethod,
} = sequelize.models;

Service.hasOne(ServiceRecurrence, { foreignKey: 'serviceId' });
ServiceRecurrence.belongsTo(Service, { foreignKey: 'serviceId' });

Service.hasMany(ServiceInvoice, { foreignKey: 'serviceId' });
ServiceInvoice.belongsTo(Service, { foreignKey: 'serviceId' });
ServiceInvoice.belongsTo(NoteTemplate, { foreignKey: 'termsTemplateId', as: 'termsTemplate' });
ServiceInvoice.belongsTo(NoteTemplate, { foreignKey: 'notesTemplateId', as: 'notesTemplate' });

ServiceInvoice.hasMany(InvoiceItem, { foreignKey: 'serviceInvoiceId' });
InvoiceItem.belongsTo(ServiceInvoice, { foreignKey: 'serviceInvoiceId' });
InvoiceItem.belongsTo(Item, { foreignKey: 'itemId' });

ServiceInvoice.hasOne(InvoiceFrequency, { foreignKey: 'serviceInvoiceId' });
InvoiceFrequency.belongsTo(ServiceInvoice, { foreignKey: 'serviceInvoiceId' });

Service.hasMany(ServiceEstimate, { foreignKey: 'serviceId' });
ServiceEstimate.belongsTo(Service, { foreignKey: 'serviceId' });
ServiceEstimate.belongsTo(EstimateTemplate, { foreignKey: 'templateId' });
ServiceEstimate.belongsTo(NoteTemplate, { foreignKey: 'termsTemplateId', as: 'termsTemplate' });
ServiceEstimate.belongsTo(NoteTemplate, { foreignKey: 'notesTemplateId', as: 'notesTemplate' });

ServiceEstimate.hasMany(ServiceEstimateItem, { foreignKey: 'serviceEstimateId' });
ServiceEstimateItem.belongsTo(ServiceEstimate, { foreignKey: 'serviceEstimateId' });
ServiceEstimateItem.belongsTo(Item, { foreignKey: 'itemId' });
ServiceEstimateItem.belongsTo(TaxRate, { foreignKey: 'taxRateId' });

Service.hasMany(Material, { foreignKey: 'serviceId' });
Material.belongsTo(Service, { foreignKey: 'serviceId' });
Material.belongsTo(MaterialsMaster, { foreignKey: 'materialId' });
Material.belongsTo(UnitType, { foreignKey: 'unitsTypeId' });
Material.belongsTo(ApplicationMethod, { foreignKey: 'methodId' });
Material.belongsTo(Location, { foreignKey: 'locationId' });
Material.belongsTo(Pest, { foreignKey: 'targetPestId' });

// TodoList doubles as both a reusable checklist template (serviceId set) and a
// per-booking snapshot copy of one (bookingId set) - exactly one is non-null,
// enforced by a DB CHECK constraint (see the table-merge migration).
Service.hasMany(TodoList, { foreignKey: 'serviceId' });
TodoList.belongsTo(Service, { foreignKey: 'serviceId' });
TodoList.hasMany(Todo, { foreignKey: 'todoListId' });
Todo.belongsTo(TodoList, { foreignKey: 'todoListId' });

Service.hasMany(Booking, { foreignKey: 'serviceId' });
Booking.belongsTo(Service, { foreignKey: 'serviceId' });
Customer.hasMany(Booking, { foreignKey: 'customerId' });
Booking.belongsTo(Customer, { foreignKey: 'customerId' });

// Material doubles as both a reusable per-service template (serviceId set)
// and a per-booking snapshot copy of one (bookingId set) - exactly one is
// non-null, enforced by a DB CHECK constraint (see the table-merge migration).
Booking.hasMany(Material, { foreignKey: 'bookingId' });
Material.belongsTo(Booking, { foreignKey: 'bookingId' });

Booking.hasMany(TodoList, { foreignKey: 'bookingId' });
TodoList.belongsTo(Booking, { foreignKey: 'bookingId' });

Customer.hasMany(Address, { foreignKey: 'customerId' });
Address.belongsTo(Customer, { foreignKey: 'customerId' });
Booking.belongsTo(Address, { foreignKey: 'addressId' });

Booking.hasMany(CustomerInvoice, { foreignKey: 'bookingId' });
CustomerInvoice.belongsTo(Booking, { foreignKey: 'bookingId' });
CustomerInvoice.belongsTo(Customer, { foreignKey: 'customerId' });
CustomerInvoice.belongsTo(ServiceInvoice, { foreignKey: 'sourceInvoiceId' });
Customer.hasMany(CustomerInvoice, { foreignKey: 'customerId' });

// customer_line_items is a deliberate polymorphic exception to one-model-per-
// table (see root CLAUDE.md) - parentId has no DB-level FK, so these
// associations use constraints: false and a scope on parentType to keep each
// side (estimate vs invoice) filtered automatically on every include/create.
CustomerInvoice.hasMany(CustomerLineItem, {
  foreignKey: 'parentId',
  constraints: false,
  scope: { parentType: 'invoice' },
  as: 'items',
});
CustomerLineItem.belongsTo(CustomerInvoice, { foreignKey: 'parentId', constraints: false, as: 'invoice' });
CustomerLineItem.belongsTo(Item, { foreignKey: 'itemId' });

CustomerInvoice.belongsTo(Address, { foreignKey: 'addressId', as: 'address' });
Address.hasMany(CustomerInvoice, { foreignKey: 'addressId' });

Booking.hasMany(CustomerEstimate, { foreignKey: 'bookingId' });
CustomerEstimate.belongsTo(Booking, { foreignKey: 'bookingId' });
CustomerEstimate.belongsTo(Customer, { foreignKey: 'customerId' });
CustomerEstimate.belongsTo(ServiceEstimate, { foreignKey: 'sourceEstimateId' });
CustomerEstimate.hasOne(CustomerInvoice, { foreignKey: 'estimateId' });
CustomerInvoice.belongsTo(CustomerEstimate, { foreignKey: 'estimateId' });
Customer.hasMany(CustomerEstimate, { foreignKey: 'customerId' });

CustomerEstimate.hasMany(CustomerLineItem, {
  foreignKey: 'parentId',
  constraints: false,
  scope: { parentType: 'estimate' },
  as: 'items',
});
CustomerLineItem.belongsTo(CustomerEstimate, { foreignKey: 'parentId', constraints: false, as: 'estimate' });

// CustomerDocument doubles as both a per-customer document instance
// (customerId set) and a per-service template row (serviceId set) - exactly
// one is non-null, enforced by a DB CHECK constraint (see the table-merge
// migration). bookingId is an optional detail, only meaningful on
// customerId-owned rows.
Customer.hasMany(CustomerDocument, { foreignKey: 'customerId' });
CustomerDocument.belongsTo(Customer, { foreignKey: 'customerId' });
Service.hasMany(CustomerDocument, { foreignKey: 'serviceId' });
CustomerDocument.belongsTo(Service, { foreignKey: 'serviceId' });
CustomerDocument.belongsTo(Booking, { foreignKey: 'bookingId' });
CustomerDocument.belongsTo(ServiceDocumentLibrary, { foreignKey: 'documentId' });
CustomerDocument.belongsTo(Pdf, { foreignKey: 'pdfId' });

Customer.hasMany(CustomerLedgerEntry, { foreignKey: 'customerId' });
CustomerLedgerEntry.belongsTo(Customer, { foreignKey: 'customerId' });
CustomerLedgerEntry.belongsTo(CustomerInvoice, { foreignKey: 'referenceId' });

Customer.hasMany(CustomerPaymentMethod, { foreignKey: 'customerId' });
CustomerPaymentMethod.belongsTo(Customer, { foreignKey: 'customerId' });

export { sequelize };
export default sequelize.models;

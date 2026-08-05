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
import defineCustomMaterial from './custom-material.model.js';
import defineLocation from './location.model.js';
import definePest from './pest.model.js';
import defineMaterial from './material.model.js';
import defineServiceDocumentLibrary from './service-document-library.model.js';
import definePdf from './pdf.model.js';
import defineServiceDocument from './service-document.model.js';
import defineTodoList from './todo-list.model.js';
import defineTodo from './todo.model.js';
import defineCustomer from './customer.model.js';
import defineRevokedToken from './revoked-token.model.js';
import defineBooking from './booking.model.js';
import defineJobMaterial from './job-material.model.js';
import defineJobTodoList from './job-todo-list.model.js';
import defineJobTodo from './job-todo.model.js';
import defineAddress from './address.model.js';
import defineCustomerInvoice from './customer-invoice.model.js';
import defineCustomerInvoiceItem from './customer-invoice-item.model.js';
import defineCustomerEstimate from './customer-estimate.model.js';
import defineCustomerEstimateItem from './customer-estimate-item.model.js';
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
  defineCustomMaterial,
  defineLocation,
  definePest,
  defineMaterial,
  defineServiceDocumentLibrary,
  definePdf,
  defineServiceDocument,
  defineTodoList,
  defineTodo,
  defineCustomer,
  defineRevokedToken,
  defineBooking,
  defineJobMaterial,
  defineJobTodoList,
  defineJobTodo,
  defineAddress,
  defineCustomerInvoice,
  defineCustomerInvoiceItem,
  defineCustomerEstimate,
  defineCustomerEstimateItem,
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
  CustomMaterial,
  Location,
  Pest,
  Material,
  ServiceDocumentLibrary,
  Pdf,
  ServiceDocument,
  TodoList,
  Todo,
  Customer,
  Booking,
  JobMaterial,
  JobTodoList,
  JobTodo,
  Address,
  CustomerInvoice,
  CustomerInvoiceItem,
  CustomerEstimate,
  CustomerEstimateItem,
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
InvoiceItem.belongsTo(TaxRate, { foreignKey: 'taxRateId' });

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
Material.belongsTo(CustomMaterial, { foreignKey: 'customMaterialId' });
Material.belongsTo(Location, { foreignKey: 'locationId' });
Material.belongsTo(Pest, { foreignKey: 'targetPestId' });

Service.hasMany(ServiceDocument, { foreignKey: 'serviceId' });
ServiceDocument.belongsTo(Service, { foreignKey: 'serviceId' });
ServiceDocument.belongsTo(ServiceDocumentLibrary, { foreignKey: 'documentId' });
ServiceDocument.belongsTo(Pdf, { foreignKey: 'pdfId' });

Service.hasMany(TodoList, { foreignKey: 'serviceId' });
TodoList.belongsTo(Service, { foreignKey: 'serviceId' });
TodoList.hasMany(Todo, { foreignKey: 'todoListId' });
Todo.belongsTo(TodoList, { foreignKey: 'todoListId' });

Service.hasMany(Booking, { foreignKey: 'serviceId' });
Booking.belongsTo(Service, { foreignKey: 'serviceId' });
Customer.hasMany(Booking, { foreignKey: 'customerId' });
Booking.belongsTo(Customer, { foreignKey: 'customerId' });

Booking.hasMany(JobMaterial, { foreignKey: 'bookingId' });
JobMaterial.belongsTo(Booking, { foreignKey: 'bookingId' });
JobMaterial.belongsTo(MaterialsMaster, { foreignKey: 'materialId' });
JobMaterial.belongsTo(UnitType, { foreignKey: 'unitsTypeId' });
JobMaterial.belongsTo(ApplicationMethod, { foreignKey: 'methodId' });
JobMaterial.belongsTo(CustomMaterial, { foreignKey: 'customMaterialId' });
JobMaterial.belongsTo(Location, { foreignKey: 'locationId' });
JobMaterial.belongsTo(Pest, { foreignKey: 'targetPestId' });

Booking.hasMany(JobTodoList, { foreignKey: 'bookingId' });
JobTodoList.belongsTo(Booking, { foreignKey: 'bookingId' });
JobTodoList.hasMany(JobTodo, { foreignKey: 'jobTodoListId' });
JobTodo.belongsTo(JobTodoList, { foreignKey: 'jobTodoListId' });

Customer.hasMany(Address, { foreignKey: 'customerId' });
Address.belongsTo(Customer, { foreignKey: 'customerId' });
Booking.belongsTo(Address, { foreignKey: 'addressId' });

Booking.hasMany(CustomerInvoice, { foreignKey: 'bookingId' });
CustomerInvoice.belongsTo(Booking, { foreignKey: 'bookingId' });
CustomerInvoice.belongsTo(Customer, { foreignKey: 'customerId' });
CustomerInvoice.belongsTo(ServiceInvoice, { foreignKey: 'sourceInvoiceId' });
Customer.hasMany(CustomerInvoice, { foreignKey: 'customerId' });

CustomerInvoice.hasMany(CustomerInvoiceItem, { foreignKey: 'customerInvoiceId', as: 'items' });
CustomerInvoiceItem.belongsTo(CustomerInvoice, { foreignKey: 'customerInvoiceId' });
CustomerInvoiceItem.belongsTo(Item, { foreignKey: 'itemId' });
CustomerInvoiceItem.belongsTo(TaxRate, { foreignKey: 'taxRateId' });

Booking.hasMany(CustomerEstimate, { foreignKey: 'bookingId' });
CustomerEstimate.belongsTo(Booking, { foreignKey: 'bookingId' });
CustomerEstimate.belongsTo(Customer, { foreignKey: 'customerId' });
CustomerEstimate.belongsTo(ServiceEstimate, { foreignKey: 'sourceEstimateId' });
Customer.hasMany(CustomerEstimate, { foreignKey: 'customerId' });

CustomerEstimate.hasMany(CustomerEstimateItem, { foreignKey: 'customerEstimateId', as: 'items' });
CustomerEstimateItem.belongsTo(CustomerEstimate, { foreignKey: 'customerEstimateId' });
CustomerEstimateItem.belongsTo(Item, { foreignKey: 'itemId' });
CustomerEstimateItem.belongsTo(TaxRate, { foreignKey: 'taxRateId' });

Customer.hasMany(CustomerDocument, { foreignKey: 'customerId' });
CustomerDocument.belongsTo(Customer, { foreignKey: 'customerId' });
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

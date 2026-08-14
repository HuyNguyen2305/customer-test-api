import { createContainer, asClass, asValue, InjectionMode } from 'awilix';

import models from '#models/index.js';

import { REPOSITORY_KEYS, SERVICE_KEYS, CONTROLLER_KEYS } from '#constants/singleton.js';

import AuthRepository from '#repositories/auth.repository.js';
import BalanceRepository from '#repositories/balance.repository.js';
import WorkOrderRepository from '#repositories/work-order.repository.js';
import BookingRepository from '#repositories/booking.repository.js';
import ServiceRepository from '#repositories/service.repository.js';
import ServiceRecurrenceRepository from '#repositories/service-recurrence.repository.js';
import TodoListRepository from '#repositories/todo-list.repository.js';
import MaterialRepository from '#repositories/material.repository.js';
import JobMaterialRepository from '#repositories/job-material.repository.js';
import JobTodoListRepository from '#repositories/job-todo-list.repository.js';
import JobTodoRepository from '#repositories/job-todo.repository.js';
import CustomerInvoiceRepository from '#repositories/customer-invoice.repository.js';
import InvoiceFrequencyRepository from '#repositories/invoice-frequency.repository.js';
import ServiceInvoiceRepository from '#repositories/service-invoice.repository.js';
import CustomerLedgerEntryRepository from '#repositories/customer-ledger-entry.repository.js';
import CustomerRepository from '#repositories/customer.repository.js';
import CustomerEstimateRepository from '#repositories/customer-estimate.repository.js';
import CustomerPaymentMethodRepository from '#repositories/customer-payment-method.repository.js';
import CustomerDocumentRepository from '#repositories/customer-document.repository.js';
import AddressRepository from '#repositories/address.repository.js';
import TaxRateRepository from '#repositories/tax-rate.repository.js';
import InvoiceItemRepository from '#repositories/invoice-item.repository.js';
import CustomerInvoiceItemRepository from '#repositories/customer-invoice-item.repository.js';
import CustomerInvoiceTaxRepository from '#repositories/customer-invoice-tax.repository.js';
import ItemRepository from '#repositories/item.repository.js';

import AuthService from '#service/auth.service.js';
import BalanceService from '#service/balance.service.js';
import WorkOrderService from '#service/work-order.service.js';
import RecurringBookingGeneratorService from '#service/recurring-booking-generator.service.js';
import JobSnapshotService from '#service/job-snapshot.service.js';
import JobSyncService from '#service/job-sync.service.js';
import JobMaterialService from '#service/job-material.service.js';
import JobTodoService from '#service/job-todo.service.js';
import InvoiceGenerationService from '#service/invoice-generation.service.js';
import LedgerService from '#service/ledger.service.js';
import ServiceLifecycleService from '#service/service-lifecycle.service.js';
import CustomerService from '#service/customer.service.js';
import CustomerInvoiceService from '#service/customer-invoice.service.js';
import CustomerEstimateService from '#service/customer-estimate.service.js';
import CustomerPaymentMethodService from '#service/customer-payment-method.service.js';
import CustomerDocumentService from '#service/customer-document.service.js';
import AddressService from '#service/address.service.js';
import CustomerInvoiceItemService from '#service/customer-invoice-item.service.js';
import InvoicePdfService from '#service/invoice-pdf.service.js';
import EstimatePdfService from '#service/estimate-pdf.service.js';

import AuthController from '#controller/auth.controller.js';
import BalanceController from '#controller/balance.controller.js';
import WorkOrderController from '#controller/work-order.controller.js';
import CustomerController from '#controller/customer.controller.js';
import CustomerPaymentMethodController from '#controller/customer-payment-method.controller.js';
import CustomerInvoiceController from '#controller/customer-invoice.controller.js';
import CustomerEstimateController from '#controller/customer-estimate.controller.js';
import CustomerLedgerController from '#controller/customer-ledger.controller.js';
import CustomerDocumentController from '#controller/customer-document.controller.js';
import AddressController from '#controller/address.controller.js';
import CustomerInvoiceItemController from '#controller/customer-invoice-item.controller.js';

const container = createContainer({ injectionMode: InjectionMode.PROXY });

container.register({
  balanceModel: asValue(models.Balance),
  bookingModel: asValue(models.Booking),
  serviceModel: asValue(models.Service),
  serviceRecurrenceModel: asValue(models.ServiceRecurrence),
  todoListModel: asValue(models.TodoList),
  todoModel: asValue(models.Todo),
  materialModel: asValue(models.Material),
  jobMaterialModel: asValue(models.JobMaterial),
  jobTodoListModel: asValue(models.JobTodoList),
  jobTodoModel: asValue(models.JobTodo),
  customerInvoiceModel: asValue(models.CustomerInvoice),
  invoiceFrequencyModel: asValue(models.InvoiceFrequency),
  serviceInvoiceModel: asValue(models.ServiceInvoice),
  customerLedgerEntryModel: asValue(models.CustomerLedgerEntry),
  customerModel: asValue(models.Customer),
  revokedTokenModel: asValue(models.RevokedToken),
  addressModel: asValue(models.Address),
  customerInvoiceItemModel: asValue(models.CustomerInvoiceItem),
  customerEstimateModel: asValue(models.CustomerEstimate),
  customerEstimateItemModel: asValue(models.CustomerEstimateItem),
  customerPaymentMethodModel: asValue(models.CustomerPaymentMethod),
  customerDocumentModel: asValue(models.CustomerDocument),
  serviceDocumentLibraryModel: asValue(models.ServiceDocumentLibrary),
  pdfModel: asValue(models.Pdf),
  taxRateModel: asValue(models.TaxRate),
  invoiceItemModel: asValue(models.InvoiceItem),
  customerInvoiceTaxModel: asValue(models.CustomerInvoiceTax),
  itemModel: asValue(models.Item),

  [REPOSITORY_KEYS.AUTH_REPOSITORY]: asClass(AuthRepository).scoped(),
  [REPOSITORY_KEYS.BALANCE_REPOSITORY]: asClass(BalanceRepository).scoped(),
  [REPOSITORY_KEYS.WORK_ORDER_REPOSITORY]: asClass(WorkOrderRepository).scoped(),
  [REPOSITORY_KEYS.BOOKING_REPOSITORY]: asClass(BookingRepository).scoped(),
  [REPOSITORY_KEYS.SERVICE_REPOSITORY]: asClass(ServiceRepository).scoped(),
  [REPOSITORY_KEYS.SERVICE_RECURRENCE_REPOSITORY]: asClass(ServiceRecurrenceRepository).scoped(),
  [REPOSITORY_KEYS.TODO_LIST_REPOSITORY]: asClass(TodoListRepository).scoped(),
  [REPOSITORY_KEYS.MATERIAL_REPOSITORY]: asClass(MaterialRepository).scoped(),
  [REPOSITORY_KEYS.JOB_MATERIAL_REPOSITORY]: asClass(JobMaterialRepository).scoped(),
  [REPOSITORY_KEYS.JOB_TODO_LIST_REPOSITORY]: asClass(JobTodoListRepository).scoped(),
  [REPOSITORY_KEYS.JOB_TODO_REPOSITORY]: asClass(JobTodoRepository).scoped(),
  [REPOSITORY_KEYS.CUSTOMER_INVOICE_REPOSITORY]: asClass(CustomerInvoiceRepository).scoped(),
  [REPOSITORY_KEYS.INVOICE_FREQUENCY_REPOSITORY]: asClass(InvoiceFrequencyRepository).scoped(),
  [REPOSITORY_KEYS.SERVICE_INVOICE_REPOSITORY]: asClass(ServiceInvoiceRepository).scoped(),
  [REPOSITORY_KEYS.CUSTOMER_LEDGER_ENTRY_REPOSITORY]: asClass(CustomerLedgerEntryRepository).scoped(),
  [REPOSITORY_KEYS.CUSTOMER_REPOSITORY]: asClass(CustomerRepository).scoped(),
  [REPOSITORY_KEYS.CUSTOMER_ESTIMATE_REPOSITORY]: asClass(CustomerEstimateRepository).scoped(),
  [REPOSITORY_KEYS.CUSTOMER_PAYMENT_METHOD_REPOSITORY]: asClass(CustomerPaymentMethodRepository).scoped(),
  [REPOSITORY_KEYS.CUSTOMER_DOCUMENT_REPOSITORY]: asClass(CustomerDocumentRepository).scoped(),
  [REPOSITORY_KEYS.ADDRESS_REPOSITORY]: asClass(AddressRepository).scoped(),
  [REPOSITORY_KEYS.TAX_RATE_REPOSITORY]: asClass(TaxRateRepository).scoped(),
  [REPOSITORY_KEYS.INVOICE_ITEM_REPOSITORY]: asClass(InvoiceItemRepository).scoped(),
  [REPOSITORY_KEYS.CUSTOMER_INVOICE_ITEM_REPOSITORY]: asClass(CustomerInvoiceItemRepository).scoped(),
  [REPOSITORY_KEYS.ITEM_REPOSITORY]: asClass(ItemRepository).scoped(),
  [REPOSITORY_KEYS.CUSTOMER_INVOICE_TAX_REPOSITORY]: asClass(CustomerInvoiceTaxRepository).scoped(),

  [SERVICE_KEYS.AUTH_SERVICE]: asClass(AuthService).scoped(),
  [SERVICE_KEYS.BALANCE_SERVICE]: asClass(BalanceService).scoped(),
  [SERVICE_KEYS.WORK_ORDER_SERVICE]: asClass(WorkOrderService).scoped(),
  [SERVICE_KEYS.RECURRING_BOOKING_GENERATOR_SERVICE]: asClass(RecurringBookingGeneratorService).scoped(),
  [SERVICE_KEYS.JOB_SNAPSHOT_SERVICE]: asClass(JobSnapshotService).scoped(),
  [SERVICE_KEYS.JOB_SYNC_SERVICE]: asClass(JobSyncService).scoped(),
  [SERVICE_KEYS.JOB_MATERIAL_SERVICE]: asClass(JobMaterialService).scoped(),
  [SERVICE_KEYS.JOB_TODO_SERVICE]: asClass(JobTodoService).scoped(),
  [SERVICE_KEYS.INVOICE_GENERATION_SERVICE]: asClass(InvoiceGenerationService).scoped(),
  [SERVICE_KEYS.LEDGER_SERVICE]: asClass(LedgerService).scoped(),
  [SERVICE_KEYS.SERVICE_LIFECYCLE_SERVICE]: asClass(ServiceLifecycleService).scoped(),
  [SERVICE_KEYS.CUSTOMER_SERVICE]: asClass(CustomerService).scoped(),
  [SERVICE_KEYS.CUSTOMER_INVOICE_SERVICE]: asClass(CustomerInvoiceService).scoped(),
  [SERVICE_KEYS.CUSTOMER_ESTIMATE_SERVICE]: asClass(CustomerEstimateService).scoped(),
  [SERVICE_KEYS.CUSTOMER_PAYMENT_METHOD_SERVICE]: asClass(CustomerPaymentMethodService).scoped(),
  [SERVICE_KEYS.CUSTOMER_DOCUMENT_SERVICE]: asClass(CustomerDocumentService).scoped(),
  [SERVICE_KEYS.ADDRESS_SERVICE]: asClass(AddressService).scoped(),
  [SERVICE_KEYS.CUSTOMER_INVOICE_ITEM_SERVICE]: asClass(CustomerInvoiceItemService).scoped(),
  [SERVICE_KEYS.INVOICE_PDF_SERVICE]: asClass(InvoicePdfService).scoped(),
  [SERVICE_KEYS.ESTIMATE_PDF_SERVICE]: asClass(EstimatePdfService).scoped(),

  [CONTROLLER_KEYS.AUTH_CONTROLLER]: asClass(AuthController).scoped(),
  [CONTROLLER_KEYS.BALANCE_CONTROLLER]: asClass(BalanceController).scoped(),
  [CONTROLLER_KEYS.WORK_ORDER_CONTROLLER]: asClass(WorkOrderController).scoped(),
  [CONTROLLER_KEYS.CUSTOMER_CONTROLLER]: asClass(CustomerController).scoped(),
  [CONTROLLER_KEYS.CUSTOMER_PAYMENT_METHOD_CONTROLLER]: asClass(CustomerPaymentMethodController).scoped(),
  [CONTROLLER_KEYS.CUSTOMER_INVOICE_CONTROLLER]: asClass(CustomerInvoiceController).scoped(),
  [CONTROLLER_KEYS.CUSTOMER_ESTIMATE_CONTROLLER]: asClass(CustomerEstimateController).scoped(),
  [CONTROLLER_KEYS.CUSTOMER_LEDGER_CONTROLLER]: asClass(CustomerLedgerController).scoped(),
  [CONTROLLER_KEYS.CUSTOMER_DOCUMENT_CONTROLLER]: asClass(CustomerDocumentController).scoped(),
  [CONTROLLER_KEYS.ADDRESS_CONTROLLER]: asClass(AddressController).scoped(),
  [CONTROLLER_KEYS.CUSTOMER_INVOICE_ITEM_CONTROLLER]: asClass(CustomerInvoiceItemController).scoped(),
});

export default container;

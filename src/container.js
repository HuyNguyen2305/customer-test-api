import { createContainer, asClass, asValue, InjectionMode } from 'awilix';

import models from '#models/index.js';

import { REPOSITORY_KEYS, SERVICE_KEYS, CONTROLLER_KEYS } from '#constants/singleton.js';

import AuthRepository from '#repositories/auth.repository.js';
import BalanceRepository from '#repositories/balance.repository.js';
import InvoiceRepository from '#repositories/invoice.repository.js';
import EstimateRepository from '#repositories/estimate.repository.js';
import DocumentRepository from '#repositories/document.repository.js';
import WorkOrderRepository from '#repositories/work-order.repository.js';
import PaymentOptionRepository from '#repositories/payment-option.repository.js';

import AuthService from '#service/auth.service.js';
import BalanceService from '#service/balance.service.js';
import InvoiceService from '#service/invoice.service.js';
import EstimateService from '#service/estimate.service.js';
import DocumentService from '#service/document.service.js';
import WorkOrderService from '#service/work-order.service.js';
import PaymentOptionService from '#service/payment-option.service.js';

import AuthController from '#controller/auth.controller.js';
import BalanceController from '#controller/balance.controller.js';
import InvoiceController from '#controller/invoice.controller.js';
import EstimateController from '#controller/estimate.controller.js';
import DocumentController from '#controller/document.controller.js';
import WorkOrderController from '#controller/work-order.controller.js';
import PaymentOptionController from '#controller/payment-option.controller.js';

const container = createContainer({ injectionMode: InjectionMode.PROXY });

container.register({
  balanceModel: asValue(models.Balance),
  invoiceModel: asValue(models.Invoice),
  estimateModel: asValue(models.Estimate),
  documentModel: asValue(models.Document),
  workOrderModel: asValue(models.WorkOrder),
  paymentOptionModel: asValue(models.PaymentOption),

  [REPOSITORY_KEYS.AUTH_REPOSITORY]: asClass(AuthRepository).scoped(),
  [REPOSITORY_KEYS.BALANCE_REPOSITORY]: asClass(BalanceRepository).scoped(),
  [REPOSITORY_KEYS.INVOICE_REPOSITORY]: asClass(InvoiceRepository).scoped(),
  [REPOSITORY_KEYS.ESTIMATE_REPOSITORY]: asClass(EstimateRepository).scoped(),
  [REPOSITORY_KEYS.DOCUMENT_REPOSITORY]: asClass(DocumentRepository).scoped(),
  [REPOSITORY_KEYS.WORK_ORDER_REPOSITORY]: asClass(WorkOrderRepository).scoped(),
  [REPOSITORY_KEYS.PAYMENT_OPTION_REPOSITORY]: asClass(PaymentOptionRepository).scoped(),

  [SERVICE_KEYS.AUTH_SERVICE]: asClass(AuthService).scoped(),
  [SERVICE_KEYS.BALANCE_SERVICE]: asClass(BalanceService).scoped(),
  [SERVICE_KEYS.INVOICE_SERVICE]: asClass(InvoiceService).scoped(),
  [SERVICE_KEYS.ESTIMATE_SERVICE]: asClass(EstimateService).scoped(),
  [SERVICE_KEYS.DOCUMENT_SERVICE]: asClass(DocumentService).scoped(),
  [SERVICE_KEYS.WORK_ORDER_SERVICE]: asClass(WorkOrderService).scoped(),
  [SERVICE_KEYS.PAYMENT_OPTION_SERVICE]: asClass(PaymentOptionService).scoped(),

  [CONTROLLER_KEYS.AUTH_CONTROLLER]: asClass(AuthController).scoped(),
  [CONTROLLER_KEYS.BALANCE_CONTROLLER]: asClass(BalanceController).scoped(),
  [CONTROLLER_KEYS.INVOICE_CONTROLLER]: asClass(InvoiceController).scoped(),
  [CONTROLLER_KEYS.ESTIMATE_CONTROLLER]: asClass(EstimateController).scoped(),
  [CONTROLLER_KEYS.DOCUMENT_CONTROLLER]: asClass(DocumentController).scoped(),
  [CONTROLLER_KEYS.WORK_ORDER_CONTROLLER]: asClass(WorkOrderController).scoped(),
  [CONTROLLER_KEYS.PAYMENT_OPTION_CONTROLLER]: asClass(PaymentOptionController).scoped(),
});

export default container;

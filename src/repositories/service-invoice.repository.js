import { BaseRepository } from '#common/base-repository.js';

class ServiceInvoiceRepository extends BaseRepository {
  constructor({ serviceInvoiceModel }) {
    super(serviceInvoiceModel);
  }

  findByServiceId(serviceId) {
    return this.findOne({ where: { serviceId } });
  }
}

export default ServiceInvoiceRepository;

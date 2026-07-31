import { jest } from '@jest/globals';

const { default: CustomerDocumentService } = await import('#service/customer-document.service.js');

describe('CustomerDocumentService.listDocuments', () => {
  it('paginates using default page/pageSize and resolves the name from the doc/pdf association', async () => {
    const rows = [
      { id: 'd1', type: 'doc', bookingId: 'b1', createdAt: '2026-01-01', ServiceDocumentLibrary: { name: 'Contract' } },
      { id: 'd2', type: 'pdf', bookingId: null, createdAt: '2026-01-02', Pdf: { name: 'Report.pdf' } },
    ];
    const service = Object.create(CustomerDocumentService.prototype);
    service.customerDocumentRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows, count: 2 }) };

    const result = await service.listDocuments('c1');

    expect(service.customerDocumentRepository.listByCustomerId).toHaveBeenCalledWith('c1', { limit: 20, offset: 0 });
    expect(result).toEqual({
      documents: [
        { id: 'd1', type: 'doc', name: 'Contract', bookingId: 'b1', createdAt: '2026-01-01' },
        { id: 'd2', type: 'pdf', name: 'Report.pdf', bookingId: null, createdAt: '2026-01-02' },
      ],
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
  });

  it('returns an empty list without error when the customer has no documents', async () => {
    const service = Object.create(CustomerDocumentService.prototype);
    service.customerDocumentRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };

    const result = await service.listDocuments('c1');

    expect(result).toEqual({
      documents: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
  });
});

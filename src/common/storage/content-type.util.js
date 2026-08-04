import path from 'node:path';

const CONTENT_TYPES_BY_EXTENSION = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function getContentType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return CONTENT_TYPES_BY_EXTENSION[extension] || 'application/octet-stream';
}

export default { getContentType };

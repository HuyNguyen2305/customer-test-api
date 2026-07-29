import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-storage-abs-'));
process.env.UPLOAD_DIR = uploadDir;

const { getAbsolutePath } = await import('#common/storage/local-storage.js');

describe('local-storage.getAbsolutePath', () => {
  afterAll(() => fs.rm(uploadDir, { recursive: true, force: true }));

  it('joins the relative filePath with the upload directory', () => {
    const result = getAbsolutePath('abc-file.pdf');

    expect(result).toBe(path.join(uploadDir, 'abc-file.pdf'));
  });
});

import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-storage-exists-'));
process.env.UPLOAD_DIR = uploadDir;

const { fileExists } = await import('#common/storage/local-storage.js');

describe('local-storage.fileExists', () => {
  afterAll(() => fs.rm(uploadDir, { recursive: true, force: true }));

  it('returns true when the file exists under the upload directory', async () => {
    await fs.writeFile(path.join(uploadDir, 'present.txt'), 'data');

    await expect(fileExists('present.txt')).resolves.toBe(true);
  });

  it('returns false when the file does not exist', async () => {
    await expect(fileExists('missing.txt')).resolves.toBe(false);
  });
});

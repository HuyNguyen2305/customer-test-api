import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { Readable } from 'node:stream';

const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-storage-save-'));
process.env.UPLOAD_DIR = uploadDir;

const { saveFile } = await import('#common/storage/local-storage.js');

describe('local-storage.saveFile', () => {
  afterAll(() => fs.rm(uploadDir, { recursive: true, force: true }));

  it('writes the stream to disk and returns the relative filePath and size', async () => {
    const contents = 'hello world';
    const fileStream = Readable.from(Buffer.from(contents));

    const { filePath, fileSize } = await saveFile(fileStream, 'greeting.txt');

    expect(filePath).toMatch(/-greeting\.txt$/);
    expect(fileSize).toBe(Buffer.byteLength(contents));
    const written = await fs.readFile(path.join(uploadDir, filePath), 'utf8');
    expect(written).toBe(contents);
  });

  it('recreates the upload directory if it was removed', async () => {
    await fs.rm(uploadDir, { recursive: true, force: true });
    const fileStream = Readable.from(Buffer.from('data'));

    const { filePath } = await saveFile(fileStream, 'file.txt');

    const exists = await fs
      .access(path.join(uploadDir, filePath))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });
});

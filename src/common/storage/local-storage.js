import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

async function ensureUploadDir() {
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveFile(fileStream, originalFileName) {
  await ensureUploadDir();
  const relativeFilePath = `${randomUUID()}-${path.basename(originalFileName)}`;
  const absolutePath = path.join(UPLOAD_DIR, relativeFilePath);
  await pipeline(fileStream, fs.createWriteStream(absolutePath));
  const { size } = await fsp.stat(absolutePath);
  return { filePath: relativeFilePath, fileSize: size };
}

export function getAbsolutePath(relativeFilePath) {
  return path.join(UPLOAD_DIR, relativeFilePath);
}

export async function fileExists(relativeFilePath) {
  try {
    await fsp.access(getAbsolutePath(relativeFilePath), fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export default { saveFile, getAbsolutePath, fileExists };

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredUploadFile = {
  bytes: Buffer;
  mimeType: string;
};

export type UploadFileStorage = {
  save(input: { userId: string; file: File }): Promise<string>;
};

const localStoragePrefix = "local://";

export class LocalUploadFileStorage implements UploadFileStorage {
  constructor({ rootDir = defaultUploadRootDir() }: { rootDir?: string } = {}) {
    this.rootDir = rootDir;
  }

  private readonly rootDir: string;

  async save({ userId, file }: { userId: string; file: File }): Promise<string> {
    const safeUserId = sanitizePathPart(userId);
    const extension = extensionForFile(file);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const relativePath = path.join(safeUserId, fileName);
    const targetPath = path.join(this.rootDir, relativePath);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

    return `${localStoragePrefix}${relativePath.split(path.sep).join("/")}`;
  }
}

export async function readLocalStoredUpload({
  storageKey,
  mimeType,
  rootDir = defaultUploadRootDir()
}: {
  storageKey: string;
  mimeType: string;
  rootDir?: string;
}): Promise<StoredUploadFile> {
  if (!storageKey.startsWith(localStoragePrefix)) {
    throw new Error("Unsupported upload storage key");
  }

  const relativePath = storageKey.slice(localStoragePrefix.length);
  const absoluteRoot = path.resolve(rootDir);
  const absolutePath = path.resolve(absoluteRoot, relativePath);

  if (!absolutePath.startsWith(`${absoluteRoot}${path.sep}`)) {
    throw new Error("Invalid upload storage key");
  }

  return {
    bytes: await readFile(absolutePath),
    mimeType
  };
}

function defaultUploadRootDir() {
  return process.env.UPLOAD_STORAGE_DIR ?? path.join(process.cwd(), ".data/uploads");
}

function sanitizePathPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_") || "user";
}

function extensionForFile(file: File) {
  const extension = path.extname(file.name).toLowerCase();

  if (extension && /^[a-z0-9.]+$/.test(extension)) {
    return extension;
  }

  if (file.type === "image/jpeg") {
    return ".jpg";
  }

  if (file.type === "image/webp") {
    return ".webp";
  }

  return ".png";
}

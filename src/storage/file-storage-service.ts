import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculateSha256 } from "../ingestion/document-hasher.js";

export class FileStorageService {
  private readonly storageDir: string;

  constructor(storageDir: string = "./data/uploads") {
    this.storageDir = resolve(storageDir);
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public storeFile(
    fileBytes: Uint8Array,
    originalFileName: string,
    docId: string
  ): { readonly storagePath: string; readonly sha256: string } {
    const extMatch = originalFileName.match(/\.[a-zA-Z0-9]+$/);
    const safeExt = extMatch ? extMatch[0].toLowerCase() : ".bin";
    const sanitizedDocId = docId.replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `doc_${sanitizedDocId}_${Date.now()}${safeExt}`;
    const targetPath = this.resolveSafePath(fileName);

    writeFileSync(targetPath, fileBytes);
    const sha256 = calculateSha256(fileBytes);
    return { storagePath: targetPath, sha256 };
  }

  public readFile(storagePath: string): Uint8Array {
    const safePath = this.resolveSafePath(storagePath);
    if (!existsSync(safePath)) {
      throw new Error(`File not found at storage path: ${storagePath}`);
    }
    return new Uint8Array(readFileSync(safePath));
  }

  public deleteFile(storagePath: string): void {
    const safePath = this.resolveSafePath(storagePath);
    if (existsSync(safePath)) {
      unlinkSync(safePath);
    }
  }

  public resolveSafePath(userOrRelativePath: string): string {
    const fullPath = resolve(this.storageDir, userOrRelativePath);
    if (!fullPath.startsWith(this.storageDir)) {
      throw new Error("Security violation: path traversal detected");
    }
    return fullPath;
  }
}

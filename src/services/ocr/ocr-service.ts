import type { Prisma } from "@prisma/client";

import type { UploadPurposeValue } from "@/domain/uploads";
import { normalizeOcrText } from "@/services/ocr/text-normalizer";

const maxUploadBytes = 5 * 1024 * 1024;

export type OcrResult = {
  rawText: string;
  confidence?: number;
};

export type OcrAdapter = {
  recognize(file: File): Promise<OcrResult>;
};

type OcrDb = {
  uploadAsset: {
    create(args: Prisma.UploadAssetCreateArgs): Promise<{
      id: string;
      rawText: string | null;
      normalizedText: string | null;
      ocrStatus: string;
    }>;
  };
};

export class MockOcrAdapter implements OcrAdapter {
  async recognize(file: File): Promise<OcrResult> {
    return {
      rawText: `Mock OCR result for ${file.name}. Replace this text after connecting a production OCR provider.`,
      confidence: 1
    };
  }
}

export async function processOcrUpload({
  db,
  userId,
  purpose,
  file,
  adapter
}: {
  db: OcrDb;
  userId: string;
  purpose: UploadPurposeValue;
  file: File;
  adapter: OcrAdapter;
}) {
  validateImageFile(file);

  const recognized = await adapter.recognize(file);
  const normalizedText = normalizeOcrText(recognized.rawText);
  const upload = await db.uploadAsset.create({
    data: {
      userId,
      purpose,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey: `local://${userId}/${Date.now()}-${file.name}`,
      ocrStatus: "READY",
      rawText: recognized.rawText,
      normalizedText
    }
  });

  return {
    uploadId: upload.id,
    status: upload.ocrStatus,
    rawText: upload.rawText,
    normalizedText: upload.normalizedText
  };
}

export async function createOcrDraft({
  file,
  adapter
}: {
  file: File;
  adapter: OcrAdapter;
}) {
  validateImageFile(file);

  const recognized = await adapter.recognize(file);
  const normalizedText = normalizeOcrText(recognized.rawText);

  return {
    uploadId: null,
    status: "READY",
    rawText: recognized.rawText,
    normalizedText
  };
}

function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported");
  }

  if (file.size > maxUploadBytes) {
    throw new Error("Image uploads must be 5MB or smaller");
  }
}

import type { Prisma } from "@prisma/client";

import type { UploadPurposeValue } from "@/domain/uploads";
import { normalizeOcrText } from "@/services/ocr/text-normalizer";
import type { ModelProvider } from "@/services/review/model-provider";
import {
  LocalUploadFileStorage,
  type UploadFileStorage
} from "@/services/uploads/upload-storage";

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
      errorMessage: string | null;
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

export class VisionOcrAdapter implements OcrAdapter {
  constructor({ provider }: { provider: Pick<ModelProvider, "completeVisionText"> }) {
    this.provider = provider;
  }

  private readonly provider: Pick<ModelProvider, "completeVisionText">;

  async recognize(file: File): Promise<OcrResult> {
    const rawText = await this.provider.completeVisionText({
      file,
      prompt: [
        "Transcribe all visible English writing from this image.",
        "Return plain text only.",
        "Preserve paragraph breaks when they are visible.",
        "Do not explain the image and do not add Markdown fences."
      ].join(" ")
    });

    return {
      rawText: rawText.trim()
    };
  }
}

export async function processOcrUpload({
  db,
  userId,
  purpose,
  file,
  adapter,
  storage = new LocalUploadFileStorage()
}: {
  db: OcrDb;
  userId: string;
  purpose: UploadPurposeValue;
  file: File;
  adapter: OcrAdapter;
  storage?: UploadFileStorage;
}) {
  validateImageFile(file);

  const storageKey = await storage.save({ userId, file });
  const recognized = await adapter.recognize(file).catch((error) => ({
    errorMessage: getErrorMessage(error)
  }));
  const recognitionFailed = "errorMessage" in recognized;
  const rawText = recognitionFailed ? null : recognized.rawText;
  const normalizedText = rawText ? normalizeOcrText(rawText) : null;
  const upload = await db.uploadAsset.create({
    data: {
      userId,
      purpose,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey,
      ocrStatus: recognitionFailed ? "FAILED" : "READY",
      rawText,
      normalizedText,
      errorMessage: recognitionFailed ? recognized.errorMessage : null
    }
  });

  return {
    uploadId: upload.id,
    status: upload.ocrStatus,
    rawText: upload.rawText,
    normalizedText: upload.normalizedText,
    errorMessage: upload.errorMessage
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "OCR failed";
}

import { describe, expect, it, vi } from "vitest";

import { processOcrUpload, VisionOcrAdapter } from "@/services/ocr/ocr-service";

const imageFile = new File(["fake-image"], "essay.png", { type: "image/png" });

describe("processOcrUpload", () => {
  it("rejects non-image files", async () => {
    const db = createDb();

    await expect(
      processOcrUpload({
        db,
        userId: "user-1",
        purpose: "CONTENT",
        file: new File(["text"], "essay.txt", { type: "text/plain" }),
        adapter: { recognize: vi.fn() }
      })
    ).rejects.toThrow("Only image uploads are supported");

    expect(db.uploadAsset.create).not.toHaveBeenCalled();
  });

  it("stores OCR-ready upload assets with normalized text", async () => {
    const db = createDb();
    const storage = {
      save: vi.fn().mockResolvedValue("file://uploads/user-1/essay.png")
    };

    const result = await processOcrUpload({
      db,
      userId: "user-1",
      purpose: "CONTENT",
      file: imageFile,
      storage,
      adapter: {
        recognize: vi.fn().mockResolvedValue({
          rawText: "This is a sentence .\n\nSecond paragraph.",
          confidence: 0.9
        })
      }
    });

    expect(db.uploadAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        purpose: "CONTENT",
        fileName: "essay.png",
        mimeType: "image/png",
        sizeBytes: imageFile.size,
        storageKey: "file://uploads/user-1/essay.png",
        ocrStatus: "READY",
        rawText: "This is a sentence .\n\nSecond paragraph.",
        normalizedText: "This is a sentence.\n\nSecond paragraph."
      })
    });
    expect(storage.save).toHaveBeenCalledWith({
      userId: "user-1",
      file: imageFile
    });
    expect(result.normalizedText).toBe("This is a sentence.\n\nSecond paragraph.");
  });

  it("keeps the uploaded image when OCR recognition fails", async () => {
    const db = createDb();
    const storage = {
      save: vi.fn().mockResolvedValue("file://uploads/user-1/essay.png")
    };

    const result = await processOcrUpload({
      db,
      userId: "user-1",
      purpose: "CONTENT",
      file: imageFile,
      storage,
      adapter: {
        recognize: vi.fn().mockRejectedValue(new Error("provider unavailable"))
      }
    });

    expect(db.uploadAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        purpose: "CONTENT",
        storageKey: "file://uploads/user-1/essay.png",
        ocrStatus: "FAILED",
        rawText: null,
        normalizedText: null,
        errorMessage: "provider unavailable"
      })
    });
    expect(result).toEqual(
      expect.objectContaining({
        uploadId: "upload-1",
        status: "FAILED",
        normalizedText: null,
        errorMessage: "provider unavailable"
      })
    );
  });

  it("rejects oversized image files", async () => {
    const largeFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
      type: "image/png"
    });

    await expect(
      processOcrUpload({
        db: createDb(),
        userId: "user-1",
        purpose: "PROMPT",
        file: largeFile,
        adapter: { recognize: vi.fn() }
      })
    ).rejects.toThrow("Image uploads must be 5MB or smaller");
  });
});

describe("VisionOcrAdapter", () => {
  it("transcribes image text through a vision provider", async () => {
    const provider = {
      completeVisionText: vi.fn().mockResolvedValue("  The essay text.  ")
    };
    const adapter = new VisionOcrAdapter({ provider });

    const result = await adapter.recognize(imageFile);

    expect(result.rawText).toBe("The essay text.");
    expect(provider.completeVisionText).toHaveBeenCalledWith({
      file: imageFile,
      prompt: expect.stringContaining("Transcribe")
    });
  });
});

function createDb() {
  return {
    uploadAsset: {
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: "upload-1",
          ...data
        })
      )
    }
  };
}

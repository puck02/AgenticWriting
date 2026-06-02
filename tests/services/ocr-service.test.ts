import { describe, expect, it, vi } from "vitest";

import { processOcrUpload } from "@/services/ocr/ocr-service";

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

    const result = await processOcrUpload({
      db,
      userId: "user-1",
      purpose: "CONTENT",
      file: imageFile,
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
        ocrStatus: "READY",
        rawText: "This is a sentence .\n\nSecond paragraph.",
        normalizedText: "This is a sentence.\n\nSecond paragraph."
      })
    });
    expect(result.normalizedText).toBe("This is a sentence.\n\nSecond paragraph.");
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

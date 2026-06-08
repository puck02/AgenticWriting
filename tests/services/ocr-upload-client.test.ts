import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prepareImageForOcr: vi.fn()
}));

vi.mock("@/services/ocr/image-preprocessor", () => ({
  prepareImageForOcr: mocks.prepareImageForOcr
}));

import { uploadImageForOcr } from "@/services/ocr/upload-client";

describe("uploadImageForOcr", () => {
  it("uploads the preprocessed image file for OCR", async () => {
    const originalFile = new File(["original"], "essay.png", { type: "image/png" });
    const compressedFile = new File(["compressed"], "essay.jpg", {
      type: "image/jpeg"
    });
    mocks.prepareImageForOcr.mockResolvedValueOnce(compressedFile);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        uploadId: "upload-1",
        normalizedText: "Recognized text."
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadImageForOcr({
      purpose: "CONTENT",
      file: originalFile
    });
    const [, init] = fetchMock.mock.calls[0];
    const body = init.body as FormData;

    expect(result).toEqual({
      uploadId: "upload-1",
      normalizedText: "Recognized text."
    });
    expect(mocks.prepareImageForOcr).toHaveBeenCalledWith(originalFile);
    expect(body.get("file")).toBe(compressedFile);
  });
});

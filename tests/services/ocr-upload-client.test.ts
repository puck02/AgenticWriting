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
      normalizedText: "Recognized text.",
      status: "READY"
    });
    expect(mocks.prepareImageForOcr).toHaveBeenCalledWith(originalFile);
    expect(body.get("file")).toBe(compressedFile);
  });

  it("returns a clear error when the upload endpoint responds with html", async () => {
    mocks.prepareImageForOcr.mockResolvedValueOnce(
      new File(["image"], "essay.png", { type: "image/png" })
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ "content-type": "text/html" }),
        text: vi.fn().mockResolvedValue("<!doctype html><html></html>")
      })
    );

    await expect(
      uploadImageForOcr({
        purpose: "CONTENT",
        file: new File(["image"], "essay.png", { type: "image/png" })
      })
    ).rejects.toThrow("图片识别服务暂时不可用，请稍后重试。");
  });

  it("returns a saved upload id when OCR fails after storing the image", async () => {
    mocks.prepareImageForOcr.mockResolvedValueOnce(
      new File(["image"], "essay.png", { type: "image/png" })
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({
          uploadId: "upload-1",
          status: "FAILED",
          errorMessage: "Model provider returned non-JSON response"
        })
      })
    );

    const result = await uploadImageForOcr({
      purpose: "CONTENT",
      file: new File(["image"], "essay.png", { type: "image/png" })
    });

    expect(result).toEqual({
      uploadId: "upload-1",
      normalizedText: "",
      status: "FAILED",
      error: "图片已保存，但文字识别暂时不可用。"
    });
  });
});

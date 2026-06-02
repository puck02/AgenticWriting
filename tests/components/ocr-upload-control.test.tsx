import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OcrUploadControl } from "@/components/OcrUploadControl";

describe("OcrUploadControl", () => {
  it("uploads an image and returns recognized text", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        normalizedText: "Recognized essay text."
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const onRecognized = vi.fn();

    render(
      <OcrUploadControl
        purpose="CONTENT"
        label="上传正文图片识别"
        onRecognized={onRecognized}
      />
    );

    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [new File(["fake-image"], "essay.png", { type: "image/png" })]
      }
    });

    await waitFor(() => {
      expect(onRecognized).toHaveBeenCalledWith("Recognized essay text.");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/uploads/ocr",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData)
      })
    );
    expect(screen.getByText("识别完成，请核对后再提交。")).toBeTruthy();
  });
});

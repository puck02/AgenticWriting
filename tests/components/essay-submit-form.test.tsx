import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EssaySubmitForm } from "@/components/EssaySubmitForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

describe("EssaySubmitForm", () => {
  it("recognizes a pasted prompt image and fills the prompt textarea", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        normalizedText: "Recognized prompt text."
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<EssaySubmitForm />);

    const promptInput = screen.getByLabelText("作文题目");
    fireEvent.paste(promptInput, {
      clipboardData: {
        items: [
          {
            type: "image/png",
            getAsFile: () =>
              new File(["fake-image"], "clipboard.png", { type: "image/png" })
          }
        ]
      }
    });

    await waitFor(() => {
      expect((promptInput as HTMLTextAreaElement).value).toBe(
        "Recognized prompt text."
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/uploads/ocr",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData)
      })
    );
    expect(screen.getByText("题目图片已识别，请核对后再提交。")).toBeTruthy();
  });

  it("recognizes a pasted content image and fills the content textarea", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        normalizedText: "Recognized essay body."
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<EssaySubmitForm />);

    const contentInput = screen.getByLabelText("作文正文");
    fireEvent.paste(contentInput, {
      clipboardData: {
        items: [
          {
            type: "image/png",
            getAsFile: () =>
              new File(["fake-image"], "clipboard.png", { type: "image/png" })
          }
        ]
      }
    });

    await waitFor(() => {
      expect((contentInput as HTMLTextAreaElement).value).toBe(
        "Recognized essay body."
      );
    });
    expect(screen.getByText("正文图片已识别，请核对后再提交。")).toBeTruthy();
  });
});

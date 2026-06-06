import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EssaySubmitForm } from "@/components/EssaySubmitForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

describe("EssaySubmitForm", () => {
  it("keeps submit disabled until prompt and content are ready", () => {
    render(<EssaySubmitForm />);

    const submitButton = screen.getByRole("button", { name: "提交批改" });

    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("作文题目"), {
      target: { value: "Write about steady practice." }
    });
    fireEvent.change(screen.getByLabelText("作文正文"), {
      target: { value: "Practice is important for every student." }
    });

    expect((submitButton as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByTestId("essay-form-readiness").textContent).toContain(
      "可以提交"
    );
  });

  it("shows a specific review progress state while submitting", async () => {
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => undefined));
    vi.stubGlobal("fetch", fetchMock);

    render(<EssaySubmitForm />);

    fireEvent.change(screen.getByLabelText("作文题目"), {
      target: { value: "Write about steady practice." }
    });
    fireEvent.change(screen.getByLabelText("作文正文"), {
      target: { value: "Practice is important for every student." }
    });
    fireEvent.click(screen.getByRole("button", { name: "提交批改" }));

    await waitFor(() => {
      expect(
        (screen.getByRole("button", { name: "正在批改..." }) as HTMLButtonElement)
          .disabled
      ).toBe(true);
    });
    expect(screen.getByRole("status").textContent).toContain(
      "正在生成批改，请保持本页打开。"
    );
  });

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

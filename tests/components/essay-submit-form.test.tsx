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
        uploadId: "upload-prompt-1",
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
        uploadId: "upload-content-1",
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

  it("submits recognized upload ids together with the essay", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          uploadId: "upload-prompt-1",
          normalizedText: "Recognized prompt text."
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          uploadId: "upload-content-1",
          normalizedText: "Recognized essay body."
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          essayId: "essay-1"
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<EssaySubmitForm />);

    fireEvent.paste(screen.getByLabelText("作文题目"), {
      clipboardData: {
        items: [
          {
            type: "image/png",
            getAsFile: () =>
              new File(["prompt-image"], "prompt.png", { type: "image/png" })
          }
        ]
      }
    });
    fireEvent.paste(screen.getByLabelText("作文正文"), {
      clipboardData: {
        items: [
          {
            type: "image/png",
            getAsFile: () =>
              new File(["content-image"], "content.png", { type: "image/png" })
          }
        ]
      }
    });

    await waitFor(() => {
      expect((screen.getByLabelText("作文题目") as HTMLTextAreaElement).value).toBe(
        "Recognized prompt text."
      );
      expect((screen.getByLabelText("作文正文") as HTMLTextAreaElement).value).toBe(
        "Recognized essay body."
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "提交批改" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    const [, submitInit] = fetchMock.mock.calls[2];
    expect(JSON.parse(submitInit.body)).toEqual(
      expect.objectContaining({
        uploadAssetIds: ["upload-prompt-1", "upload-content-1"]
      })
    );
  });

  it("keeps saved upload ids when OCR fails after storing the image", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({
          uploadId: "upload-prompt-1",
          status: "FAILED",
          error: "图片已保存，但文字识别暂时不可用。"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          essayId: "essay-1"
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<EssaySubmitForm />);

    fireEvent.paste(screen.getByLabelText("作文题目"), {
      clipboardData: {
        items: [
          {
            type: "image/png",
            getAsFile: () =>
              new File(["prompt-image"], "prompt.png", { type: "image/png" })
          }
        ]
      }
    });

    await waitFor(() => {
      expect(
        screen.getByText("图片已保存，但文字识别暂时不可用。")
      ).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText("作文题目"), {
      target: { value: "Write about steady practice." }
    });
    fireEvent.change(screen.getByLabelText("作文正文"), {
      target: { value: "Practice is important for every student." }
    });
    fireEvent.click(screen.getByRole("button", { name: "提交批改" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const [, submitInit] = fetchMock.mock.calls[1];
    expect(JSON.parse(submitInit.body)).toEqual(
      expect.objectContaining({
        uploadAssetIds: ["upload-prompt-1"]
      })
    );
  });

  it("lets users choose the review model for the submission", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        essayId: "essay-1"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<EssaySubmitForm defaultModel="gpt-5.5" />);

    fireEvent.change(screen.getByLabelText("作文题目"), {
      target: { value: "Write about steady practice." }
    });
    fireEvent.change(screen.getByLabelText("作文正文"), {
      target: { value: "Practice is important for every student." }
    });
    fireEvent.change(screen.getByLabelText("批改模型"), {
      target: { value: "gpt-5.4-mini" }
    });
    fireEvent.click(screen.getByRole("button", { name: "提交批改" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [, submitInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(submitInit.body)).toEqual(
      expect.objectContaining({
        reviewModel: "gpt-5.4-mini"
      })
    );
  });

  it("requests an idle writing hint in guidance mode and applies it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        hint: {
          completion: "This trend deserves careful attention from students.",
          reason: "承接当前句子继续展开。",
          expressionFocus: "补充观点",
          styleNote: "保持正式但不过度复杂。",
          referenceLabel: "近十年英语二图表作文"
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<EssaySubmitForm hintDelayMs={10} />);

    fireEvent.click(screen.getByRole("button", { name: "引导模式" }));
    fireEvent.change(screen.getByLabelText("作文题目"), {
      target: { value: "Write about reading habits." }
    });
    fireEvent.change(screen.getByLabelText("作文正文"), {
      target: { value: "The chart shows a clear change." }
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/guidance/hint",
        expect.objectContaining({
          method: "POST"
        })
      );
    });
    expect(
      screen.getByText("This trend deserves careful attention from students.")
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "采纳 hint" }));

    expect((screen.getByLabelText("作文正文") as HTMLTextAreaElement).value).toBe(
      "The chart shows a clear change. This trend deserves careful attention from students."
    );
  });

  it("keeps guidance mode focused without the auxiliary coach rail", () => {
    render(<EssaySubmitForm />);

    fireEvent.click(screen.getByRole("button", { name: "引导模式" }));

    expect(screen.queryByText("私人写作 coach")).toBeNull();
    expect(screen.queryByText("写作目标")).toBeNull();
    expect(screen.queryByText("题目任务已明确")).toBeNull();
    expect(
      screen.getAllByText("停顿时给一句轻提示，不打断你当前思路。").length
    ).toBeGreaterThan(0);
  });
});

"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  type ClipboardEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction
} from "react";

import {
  IslandButton,
  IslandCard,
  IslandGlyph,
  IslandSelect
} from "@/components/IslandUi";
import { OcrUploadControl } from "@/components/OcrUploadControl";
import { essayTypes, type EssayTypeValue } from "@/domain/labels";
import type { UploadPurposeValue } from "@/domain/uploads";
import { uploadImageForOcr } from "@/services/ocr/upload-client";

type PasteStatus = "idle" | "uploading" | "ready" | "failed";

type PasteOcrState = {
  status: PasteStatus;
  message: string | null;
};

export function EssaySubmitForm() {
  const router = useRouter();
  const [essayType, setEssayType] = useState<EssayTypeValue>(essayTypes[0].value);
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptPasteOcr, setPromptPasteOcr] = useState<PasteOcrState>({
    status: "idle",
    message: null
  });
  const [contentPasteOcr, setContentPasteOcr] = useState<PasteOcrState>({
    status: "idle",
    message: null
  });
  const isOcrUploading =
    promptPasteOcr.status === "uploading" || contentPasteOcr.status === "uploading";
  const hasPrompt = prompt.trim().length > 0;
  const hasContent = content.trim().length > 0;
  const canSubmit = hasPrompt && hasContent && !isPending && !isOcrUploading;
  const readinessMessage = getReadinessMessage({
    hasPrompt,
    hasContent,
    isOcrUploading,
    isPending
  });
  const contentWordCount = countEnglishWords(content);

  async function handleImagePaste({
    event,
    purpose,
    targetName,
    setText,
    setPasteOcr
  }: {
    event: ClipboardEvent<HTMLTextAreaElement>;
    purpose: UploadPurposeValue;
    targetName: "题目" | "正文";
    setText: Dispatch<SetStateAction<string>>;
    setPasteOcr: Dispatch<SetStateAction<PasteOcrState>>;
  }) {
    const file = findPastedImage(event.clipboardData.items);

    if (!file) {
      return;
    }

    event.preventDefault();
    setPasteOcr({
      status: "uploading",
      message: `正在识别粘贴的${targetName}图片...`
    });

    try {
      const recognizedText = await uploadImageForOcr({ purpose, file });
      setText(recognizedText);
      setPasteOcr({
        status: "ready",
        message: `${targetName}图片已识别，请核对后再提交。`
      });
    } catch (pasteError) {
      setPasteOcr({
        status: "failed",
        message: pasteError instanceof Error ? pasteError.message : "图片识别失败"
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("请先填写作文题目和正文。");
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayType, prompt, content })
      });

      if (!response.ok) {
        throw new Error("提交失败，请检查作文题目和正文。");
      }

      const data = (await response.json()) as { essayId?: string };

      if (!data.essayId) {
        throw new Error("批改结果缺少作文编号。");
      }

      router.push(`/essays/${data.essayId}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "提交失败，请稍后重试。"
      );
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset disabled={isPending} className="space-y-5">
        <IslandCard color="yellow" className="space-y-3 p-4">
          <label
            htmlFor="essayType"
            className="flex items-center gap-2 text-sm font-bold text-[#725d42]"
          >
            <IslandGlyph label="题型">T</IslandGlyph>
            作文类型
          </label>
          <IslandSelect
            id="essayType"
            value={essayType}
            onChange={(event) => setEssayType(event.target.value as EssayTypeValue)}
          >
            {essayTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </IslandSelect>
        </IslandCard>

        <div>
          <label
            htmlFor="prompt"
            className="mb-2 flex items-center gap-2 text-sm font-bold text-[#725d42]"
          >
            <IslandGlyph label="题目">P</IslandGlyph>
            作文题目
          </label>
          <div className="mb-3">
            <OcrUploadControl
              purpose="PROMPT"
              label="上传题目图片识别"
              onRecognized={(text) => setPrompt(text)}
            />
          </div>
          <textarea
            id="prompt"
            aria-label="作文题目"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onPaste={(event) =>
              handleImagePaste({
                event,
                purpose: "PROMPT",
                targetName: "题目",
                setText: setPrompt,
                setPasteOcr: setPromptPasteOcr
              })
            }
            required
            rows={4}
            className="writing-textarea min-h-28 px-4 py-3 text-sm leading-6 placeholder:text-[#9a835a]/60"
            placeholder="粘贴题干、图表信息或应用文要求"
          />
          {promptPasteOcr.message ? (
            <p
              className={
                promptPasteOcr.status === "failed"
                  ? "mt-2 text-sm text-red-700"
                  : "mt-2 text-sm text-[#725d42]"
              }
            >
              {promptPasteOcr.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="content"
            className="mb-2 flex items-center gap-2 text-sm font-bold text-[#725d42]"
          >
            <IslandGlyph label="正文">E</IslandGlyph>
            作文正文
          </label>
          <div className="mb-3">
            <OcrUploadControl
              purpose="CONTENT"
              label="上传正文图片识别"
              onRecognized={(text) => setContent(text)}
            />
          </div>
          <textarea
            id="content"
            aria-label="作文正文"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onPaste={(event) =>
              handleImagePaste({
                event,
                purpose: "CONTENT",
                targetName: "正文",
                setText: setContent,
                setPasteOcr: setContentPasteOcr
              })
            }
            required
            rows={14}
            className="writing-textarea min-h-80 px-4 py-3 font-mono text-sm leading-7 placeholder:text-[#9a835a]/60"
            placeholder="输入或粘贴你的英文作文"
          />
          {contentPasteOcr.message ? (
            <p
              className={
                contentPasteOcr.status === "failed"
                  ? "mt-2 text-sm text-red-700"
                  : "mt-2 text-sm text-[#725d42]"
              }
            >
              {contentPasteOcr.message}
            </p>
          ) : null}
        </div>
      </fieldset>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div
        data-testid="essay-form-readiness"
        role="status"
        aria-live="polite"
        className="grid gap-2 rounded-[18px] border-2 border-[#725d42]/10 bg-[#fffdf4]/75 p-3 text-sm text-[#725d42] sm:grid-cols-[1fr_auto]"
      >
        <p className="font-bold text-[#3f3426]">{readinessMessage}</p>
        <p className="tabular-nums">
          题目 {prompt.trim().length} 字符 / 正文 {contentWordCount} 词
        </p>
      </div>

      <IslandButton
        type="submit"
        disabled={!canSubmit}
        loading={isPending}
        loadingLabel="正在批改..."
        variant="primary"
        size="large"
      >
        {isPending ? "正在批改..." : "提交批改"}
      </IslandButton>
    </form>
  );
}

function findPastedImage(items: DataTransferItemList): File | null {
  for (const item of Array.from(items)) {
    if (!item.type.startsWith("image/")) {
      continue;
    }

    const file = item.getAsFile();

    if (file) {
      return file;
    }
  }

  return null;
}

function getReadinessMessage({
  hasPrompt,
  hasContent,
  isOcrUploading,
  isPending
}: {
  hasPrompt: boolean;
  hasContent: boolean;
  isOcrUploading: boolean;
  isPending: boolean;
}) {
  if (isPending) {
    return "正在生成批改，请保持本页打开。";
  }

  if (isOcrUploading) {
    return "正在识别图片文字，完成后可提交。";
  }

  if (!hasPrompt && !hasContent) {
    return "补全题目和正文后即可提交。";
  }

  if (!hasPrompt) {
    return "补全作文题目后即可提交。";
  }

  if (!hasContent) {
    return "补全作文正文后即可提交。";
  }

  return "可以提交，批改会同时更新你的写作画像。";
}

function countEnglishWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => /[A-Za-z]/.test(word)).length;
}

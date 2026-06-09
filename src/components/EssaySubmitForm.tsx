"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ClipboardEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction
} from "react";

import { IslandButton, IslandSelect } from "@/components/IslandUi";
import {
  OcrUploadControl,
  type OcrRecognizedUpload
} from "@/components/OcrUploadControl";
import { essayTypes, type EssayTypeValue } from "@/domain/labels";
import {
  defaultReviewModel,
  reviewModels,
  type ReviewModelValue
} from "@/domain/models";
import type { UploadPurposeValue } from "@/domain/uploads";
import { uploadImageForOcr } from "@/services/ocr/upload-client";

type PasteStatus = "idle" | "uploading" | "ready" | "failed";

type PasteOcrState = {
  status: PasteStatus;
  message: string | null;
};

type WritingMode = "review" | "guidance";

type WritingHint = {
  completion: string;
  reason: string;
  expressionFocus: string;
  styleNote: string;
  referenceLabel: string;
};

export function EssaySubmitForm({
  defaultModel = defaultReviewModel,
  hintDelayMs = 1200
}: {
  defaultModel?: ReviewModelValue;
  hintDelayMs?: number;
} = {}) {
  const router = useRouter();
  const [writingMode, setWritingMode] = useState<WritingMode>("review");
  const [essayType, setEssayType] = useState<EssayTypeValue>(essayTypes[0].value);
  const [reviewModel, setReviewModel] = useState<ReviewModelValue>(defaultModel);
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [hint, setHint] = useState<WritingHint | null>(null);
  const [isHintPending, setIsHintPending] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [lastHintDraft, setLastHintDraft] = useState("");
  const [uploadAssetIds, setUploadAssetIds] = useState<string[]>([]);
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
    isPending,
    writingMode
  });
  const contentWordCount = countEnglishWords(content);

  useEffect(() => {
    if (
      writingMode !== "guidance" ||
      !hasPrompt ||
      !hasContent ||
      isHintPending ||
      content.trim() === lastHintDraft
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      void requestWritingHint();
    }, hintDelayMs);

    return () => window.clearTimeout(timer);
  }, [
    content,
    essayType,
    hasContent,
    hasPrompt,
    isHintPending,
    hintDelayMs,
    lastHintDraft,
    prompt,
    reviewModel,
    writingMode
  ]);

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
      const recognized = await uploadImageForOcr({ purpose, file });
      setText(recognized.normalizedText);
      recordUploadAssetId(recognized.uploadId);
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
        body: JSON.stringify({
          essayType,
          prompt,
          content,
          uploadAssetIds,
          reviewModel
        })
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

  async function requestWritingHint() {
    setIsHintPending(true);
    setHintError(null);
    setLastHintDraft(content.trim());

    try {
      const response = await fetch("/api/guidance/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayType,
          prompt,
          draft: content,
          reviewModel
        })
      });
      const data = (await response.json().catch(() => ({}))) as {
        hint?: WritingHint;
        error?: string;
      };

      if (!response.ok || !data.hint) {
        throw new Error(data.error ?? "hint 生成失败");
      }

      setHint(data.hint);
    } catch (error) {
      setHintError(error instanceof Error ? error.message : "hint 生成失败");
    } finally {
      setIsHintPending(false);
    }
  }

  function applyHint() {
    if (!hint) {
      return;
    }

    setContent((currentContent) =>
      `${currentContent.trimEnd()} ${hint.completion}`.trimStart()
    );
    setHint(null);
    setHintError(null);
  }

  function recordUploadAssetId(uploadId: string | null) {
    if (!uploadId) {
      return;
    }

    setUploadAssetIds((currentIds) =>
      currentIds.includes(uploadId) ? currentIds : [...currentIds, uploadId]
    );
  }

  function applyRecognizedPrompt(upload: OcrRecognizedUpload) {
    setPrompt(upload.normalizedText);
    recordUploadAssetId(upload.uploadId);
  }

  function applyRecognizedContent(upload: OcrRecognizedUpload) {
    setContent(upload.normalizedText);
    recordUploadAssetId(upload.uploadId);
  }

  return (
    <form onSubmit={handleSubmit} className="coach-workspace-form">
      <div className="coach-workspace-header">
        <div
          className="mode-segmented-control"
          role="group"
          aria-label="写作模式"
        >
          <button
            type="button"
            className={[
              "mode-toggle-button",
              writingMode === "review" ? "mode-toggle-button-active" : ""
            ]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={writingMode === "review"}
            onClick={() => setWritingMode("review")}
          >
            批改模式
          </button>
          <button
            type="button"
            className={[
              "mode-toggle-button",
              writingMode === "guidance" ? "mode-toggle-button-active" : ""
            ]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={writingMode === "guidance"}
            onClick={() => setWritingMode("guidance")}
          >
            引导模式
          </button>
        </div>
        <p className="coach-mode-description">
          {writingMode === "guidance"
            ? "边写边获得轻量提示，先保持自己的表达，再让 AI 接住停顿。"
            : "先完整提交，再按句子进入理解、改写和迁移练习。"}
        </p>
      </div>

      <fieldset disabled={isPending} className="coach-workspace-grid">
        <section className="coach-compose-pane" aria-label="作文编辑区">
          <div className="coach-settings-row">
            <label className="coach-field-label" htmlFor="essayType">
              <span>作文类型</span>
              <IslandSelect
                id="essayType"
                value={essayType}
                onChange={(event) =>
                  setEssayType(event.target.value as EssayTypeValue)
                }
              >
                {essayTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </IslandSelect>
            </label>

            <label className="coach-field-label" htmlFor="reviewModel">
              <span>批改模型</span>
              <IslandSelect
                id="reviewModel"
                aria-label="批改模型"
                value={reviewModel}
                onChange={(event) =>
                  setReviewModel(event.target.value as ReviewModelValue)
                }
              >
                {reviewModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </IslandSelect>
            </label>
          </div>

          <section className="coach-editor-section">
            <div className="coach-section-title-row">
              <label htmlFor="prompt" className="coach-section-title">
                作文题目
              </label>
              <OcrUploadControl
                purpose="PROMPT"
                label="上传题目图片识别"
                onRecognized={applyRecognizedPrompt}
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
              className="writing-textarea coach-prompt-textarea"
              placeholder="粘贴题干、图表信息或应用文要求"
            />
            {promptPasteOcr.message ? (
              <p
                className={
                  promptPasteOcr.status === "failed"
                    ? "coach-inline-message coach-inline-message-error"
                    : "coach-inline-message"
                }
              >
                {promptPasteOcr.message}
              </p>
            ) : null}
          </section>

          <section className="coach-editor-section">
            <div className="coach-section-title-row">
              <div>
                <label htmlFor="content" className="coach-section-title">
                  作文正文
                </label>
                <p className="coach-section-subtitle">
                  {contentWordCount} words, keep drafting in your own voice
                </p>
              </div>
              <OcrUploadControl
                purpose="CONTENT"
                label="上传正文图片识别"
                onRecognized={applyRecognizedContent}
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
              className="writing-textarea coach-content-textarea"
              placeholder="输入或粘贴你的英文作文"
            />
            {contentPasteOcr.message ? (
              <p
                className={
                  contentPasteOcr.status === "failed"
                    ? "coach-inline-message coach-inline-message-error"
                    : "coach-inline-message"
                }
              >
                {contentPasteOcr.message}
              </p>
            ) : null}
          </section>

          {writingMode === "guidance" ? (
            <section className="hint-panel" aria-label="写作 hint">
              <div>
                <p className="coach-eyebrow">
                  {isHintPending ? "正在生成 hint..." : "写作 hint"}
                </p>
                {hint ? (
                  <>
                    <p className="hint-completion">{hint.completion}</p>
                    <p className="hint-meta">
                      {hint.reason} / {hint.styleNote} / {hint.referenceLabel}
                    </p>
                  </>
                ) : (
                  <p className="hint-empty">
                    停顿时给一句轻提示，不打断你当前思路。
                  </p>
                )}
                {hintError ? (
                  <p className="coach-inline-message coach-inline-message-error">
                    {hintError}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="review-copy-button whitespace-nowrap"
                disabled={!hint}
                onClick={applyHint}
              >
                采纳 hint
              </button>
            </section>
          ) : null}

          {error ? (
            <p className="coach-form-error">
              {error}
            </p>
          ) : null}

          <div
            data-testid="essay-form-readiness"
            role="status"
            aria-live="polite"
            className="coach-readiness"
          >
            <p>{readinessMessage}</p>
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
        </section>

        <aside className="coach-rail" aria-label="私人写作 coach">
          <div>
            <p className="coach-eyebrow">私人写作 coach</p>
            <h2 className="coach-rail-title">写作目标</h2>
            <p className="coach-rail-copy">
              {writingMode === "guidance"
                ? "当前目标是帮助你继续写下去，而不是替你重写整篇。"
                : "当前目标是保留真实表达，再把每条建议变成可迁移的句式。"}
            </p>
          </div>

          <div className="coach-goal-list">
            <CoachGoal complete={hasPrompt} label="题目任务已明确" />
            <CoachGoal complete={hasContent} label="正文已有完整观点" />
            <CoachGoal complete label="保留你的表达习惯" />
          </div>

          <div className="coach-rail-card">
            <p className="coach-rail-card-label">引导方式</p>
            <p className="coach-rail-card-copy">
              {writingMode === "guidance"
                ? "停顿时给一句轻提示，不打断你当前思路。"
                : "批改后按句子进入 lesson，先理解原因，再决定采纳。"}
            </p>
          </div>

          <div className="coach-rail-card">
            <p className="coach-rail-card-label">图片材料</p>
            <p className="coach-rail-card-copy">
              已保留 {uploadAssetIds.length} 张上传图片
            </p>
            <p className="coach-rail-card-note">
              提交批改时会和作文一并提交。
            </p>
          </div>

          <div className="coach-rail-card">
            <p className="coach-rail-card-label">下一步</p>
            <p className="coach-rail-card-copy">{getCoachNextStep({
              hasPrompt,
              hasContent,
              isOcrUploading,
              writingMode
            })}</p>
          </div>
        </aside>
      </fieldset>
    </form>
  );
}

function CoachGoal({
  complete,
  label
}: {
  complete: boolean;
  label: string;
}) {
  return (
    <div className={["coach-goal-item", complete ? "coach-goal-complete" : ""].join(" ")}>
      <span aria-hidden="true">{complete ? "✓" : "•"}</span>
      <p>{label}</p>
    </div>
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
  isPending,
  writingMode
}: {
  hasPrompt: boolean;
  hasContent: boolean;
  isOcrUploading: boolean;
  isPending: boolean;
  writingMode: WritingMode;
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

  if (writingMode === "guidance") {
    return "引导模式已开启，停顿后会给出一句 hint，也可以随时提交批改。";
  }

  return "可以提交，批改会同时更新你的写作画像。";
}

function getCoachNextStep({
  hasPrompt,
  hasContent,
  isOcrUploading,
  writingMode
}: {
  hasPrompt: boolean;
  hasContent: boolean;
  isOcrUploading: boolean;
  writingMode: WritingMode;
}) {
  if (isOcrUploading) {
    return "等图片识别完成，再核对题目和正文。";
  }

  if (!hasPrompt) {
    return "先补全题目，coach 才能判断任务要求。";
  }

  if (!hasContent) {
    return writingMode === "guidance"
      ? "写下第一句，停顿后会出现 hint。"
      : "保留原始正文，不要先手动润色。";
  }

  return writingMode === "guidance"
    ? "继续写，卡住时只采纳适合你语气的 hint。"
    : "提交后进入逐句 lesson。";
}

function countEnglishWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => /[A-Za-z]/.test(word)).length;
}

"use client";

import { useState } from "react";

import { IslandButton, IslandCard, IslandSelect } from "@/components/IslandUi";
import { rejectLabels, type RejectLabelValue } from "@/domain/labels";

type FeedbackStatus = "idle" | "accepted" | "rejected";

export function SuggestionCard({
  essayId,
  suggestionId,
  originalSentence,
  suggestedSentence,
  reason,
  profileExplanation,
  accepted,
  rejectLabel,
  onAccepted,
  onFeedbackSaved,
  isActive = false,
  onActivate
}: {
  essayId: string;
  suggestionId: string;
  originalSentence: string;
  suggestedSentence: string;
  reason: string;
  profileExplanation?: string | null;
  accepted?: boolean | null;
  rejectLabel?: RejectLabelValue | null;
  onAccepted?: (suggestionId: string) => void;
  onFeedbackSaved?: (suggestionId: string, accepted: boolean) => void;
  isActive?: boolean;
  onActivate?: (suggestionId: string) => void;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(
    accepted === true ? "accepted" : accepted === false ? "rejected" : "idle"
  );
  const [selectedRejectLabel, setSelectedRejectLabel] = useState<RejectLabelValue>(
    rejectLabel ?? rejectLabels[0].value
  );
  const [transferPractice, setTransferPractice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasSavedFeedback = status === "accepted" || status === "rejected";
  const statusLabel =
    status === "accepted" ? "已采纳" : status === "rejected" ? "不采纳" : "待处理";
  const statusMessage = isSubmitting
    ? "正在保存反馈..."
    : error
      ? error
      : copyMessage
        ? copyMessage
        : status === "accepted"
          ? "已采纳，表达会进入个人表达库。"
          : status === "rejected"
            ? "已记录不采纳原因。"
            : "选择后会更新你的写作画像。";
  const coachingPattern = inferCoachingPattern({
    originalSentence,
    suggestedSentence
  });
  const hasTransferPractice = transferPractice.trim().length > 0;

  async function submitFeedback({
    nextAccepted,
    nextRejectLabel
  }: {
    nextAccepted: boolean;
    nextRejectLabel?: RejectLabelValue;
  }) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/essays/${essayId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId,
          accepted: nextAccepted,
          rejectLabel: nextAccepted ? undefined : nextRejectLabel
        })
      });

      if (!response.ok) {
        throw new Error("反馈保存失败");
      }

      setStatus(nextAccepted ? "accepted" : "rejected");
      onFeedbackSaved?.(suggestionId, nextAccepted);
      if (nextAccepted) {
        onAccepted?.(suggestionId);
      }
    } catch (feedbackError) {
      setError(
        feedbackError instanceof Error ? feedbackError.message : "反馈保存失败"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copySuggestedSentence() {
    setError(null);

    try {
      await navigator.clipboard.writeText(suggestedSentence);
      setCopyMessage("已复制建议表达。");
    } catch {
      setCopyMessage("复制失败，请手动复制。");
    }
  }

  return (
    <div
      id={`review-suggestion-card-${suggestionId}`}
      data-testid={`review-suggestion-card-${suggestionId}`}
      className={[
        "review-suggestion-card",
        isActive ? "review-suggestion-active" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      tabIndex={0}
      onClick={() => onActivate?.(suggestionId)}
      onFocus={() => onActivate?.(suggestionId)}
      onMouseEnter={() => onActivate?.(suggestionId)}
    >
      <IslandCard className="lesson-card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className={[
              "review-feedback-badge",
              `review-feedback-badge-${status}`
            ].join(" ")}
          >
            {statusLabel}
          </span>
          <span className="lesson-flow-label">
            理解 -&gt; 改写 -&gt; 迁移
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="lesson-compare-box">
            <p className="lesson-label">
              原句
            </p>
            <p className="text-sm leading-6 text-[var(--aw-text)]">
              {originalSentence}
            </p>
          </div>
          <div className="lesson-compare-box lesson-compare-box-strong">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="lesson-label">
                建议表达
              </p>
              <button
                type="button"
                className="review-copy-button"
                onClick={copySuggestedSentence}
              >
                复制建议表达
              </button>
            </div>
            <p className="text-sm leading-6 text-[var(--aw-text)]">
              {renderSuggestedSentenceDiff({
                suggestionId,
                originalSentence,
                suggestedSentence
              })}
            </p>
          </div>
        </div>

        <div className="lesson-reason-block mt-4">
          <p>
            <span>为什么这样改：</span>
            {reason}
          </p>
          {profileExplanation ? (
            <p>
              <span>结合你的画像：</span>
              {profileExplanation}
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 border-t border-[var(--aw-border)] pt-4 md:grid-cols-2">
          <section className="coach-panel">
            <p className="coach-eyebrow">表达拆解</p>
            <p className="mt-2 text-sm leading-6 text-[var(--aw-text)]">
              {coachingPattern}
            </p>
            {profileExplanation ? (
              <p className="mt-2 text-xs leading-5 text-[var(--aw-text-muted)]">
                {profileExplanation}
              </p>
            ) : null}
          </section>
          <section className="coach-panel">
            <p className="coach-eyebrow">迁移练习</p>
            <p className="mt-2 text-sm leading-6 text-[var(--aw-text)]">
              把你下一句里的核心名词换进去，再用同一个结构写一句。
            </p>
            <label className="mt-3 grid gap-2 text-xs font-semibold text-[var(--aw-text-muted)]">
              迁移练习输入
              <textarea
                aria-label="迁移练习输入"
                value={transferPractice}
                onChange={(event) => setTransferPractice(event.target.value)}
                className="transfer-practice-input"
                rows={3}
                placeholder="例如：Reading plays an important role in long-term growth."
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-[var(--aw-text-muted)]">
              先保留句意，再只替换一个表达点。
            </p>
            {hasTransferPractice ? (
              <p className="transfer-practice-status" role="status">
                练习已记录，接着决定是否采纳这条表达。
              </p>
            ) : null}
          </section>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--aw-border)] pt-4 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-2 sm:grid-cols-[auto_13rem_auto] sm:items-center">
            <IslandButton
              type="button"
              variant="primary"
              className="whitespace-nowrap"
              onClick={() => submitFeedback({ nextAccepted: true })}
              disabled={isSubmitting || hasSavedFeedback}
            >
              采纳
            </IslandButton>
            <div className="min-w-0">
              <IslandSelect
                value={selectedRejectLabel}
                onChange={(event) =>
                  setSelectedRejectLabel(event.target.value as RejectLabelValue)
                }
                disabled={isSubmitting || hasSavedFeedback}
              >
                {rejectLabels.map((label) => (
                  <option key={label.value} value={label.value}>
                    {label.label}
                  </option>
                ))}
              </IslandSelect>
            </div>
            <IslandButton
              type="button"
              className="whitespace-nowrap"
              onClick={() =>
                submitFeedback({
                  nextAccepted: false,
                  nextRejectLabel: selectedRejectLabel
                })
              }
              disabled={isSubmitting || hasSavedFeedback}
            >
              不采纳
            </IslandButton>
          </div>
          <p
            role={error ? "alert" : "status"}
            aria-live="polite"
            className={
              error ? "text-sm text-red-700" : "text-sm text-[var(--aw-text-muted)]"
            }
          >
            {statusMessage}
          </p>
        </div>
      </IslandCard>
    </div>
  );
}

function renderSuggestedSentenceDiff({
  suggestionId,
  originalSentence,
  suggestedSentence
}: {
  suggestionId: string;
  originalSentence: string;
  suggestedSentence: string;
}) {
  const originalTokenSet = new Set(
    tokenizeWords(originalSentence)
      .map(normalizeToken)
      .filter((token) => token.length > 0)
  );
  const emittedTestIds = new Set<string>();

  return suggestedSentence.split(/(\s+)/).map((part, index) => {
    if (/^\s+$/.test(part)) {
      return part;
    }

    const normalizedToken = normalizeToken(part);
    const isAdded =
      normalizedToken.length > 0 && !originalTokenSet.has(normalizedToken);
    const shouldMarkTestId = isAdded && !emittedTestIds.has(normalizedToken);

    if (shouldMarkTestId) {
      emittedTestIds.add(normalizedToken);
    }

    return (
      <span
        key={`${part}-${index}`}
        className={isAdded ? "suggestion-added-token" : undefined}
        data-testid={
          shouldMarkTestId
            ? `suggestion-added-token-${suggestionId}-${normalizedToken}`
            : undefined
        }
      >
        {part}
      </span>
    );
  });
}

function tokenizeWords(sentence: string) {
  return sentence.split(/\s+/);
}

function normalizeToken(token: string) {
  return token.toLowerCase().replace(/[^a-z0-9'-]/g, "");
}

function inferCoachingPattern({
  originalSentence,
  suggestedSentence
}: {
  originalSentence: string;
  suggestedSentence: string;
}) {
  const originalWords = tokenizeWords(originalSentence).length;
  const suggestedWords = tokenizeWords(suggestedSentence).length;

  if (suggestedWords > originalWords + 4) {
    return "这条建议把单薄判断扩展成“核心名词 + 动作/作用 + 结果”的句式。";
  }

  return "这条建议保留原意，只把表达换成更符合考研写作的稳妥搭配。";
}

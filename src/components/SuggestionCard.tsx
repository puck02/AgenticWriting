"use client";

import { useState } from "react";

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
  rejectLabel
}: {
  essayId: string;
  suggestionId: string;
  originalSentence: string;
  suggestedSentence: string;
  reason: string;
  profileExplanation?: string | null;
  accepted?: boolean | null;
  rejectLabel?: RejectLabelValue | null;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(
    accepted === true ? "accepted" : accepted === false ? "rejected" : "idle"
  );
  const [selectedRejectLabel, setSelectedRejectLabel] = useState<RejectLabelValue>(
    rejectLabel ?? rejectLabels[0].value
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSavedFeedback = status === "accepted" || status === "rejected";

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
    } catch (feedbackError) {
      setError(
        feedbackError instanceof Error ? feedbackError.message : "反馈保存失败"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
            原句
          </p>
          <p className="text-sm leading-6 text-slate-800">{originalSentence}</p>
        </div>
        <div className="rounded-md border border-sky-100 bg-sky-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-sky-700">
            建议表达
          </p>
          <p className="text-sm leading-6 text-slate-950">{suggestedSentence}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
        <p>
          <span className="font-semibold text-slate-900">修改理由：</span>
          {reason}
        </p>
        {profileExplanation ? (
          <p>
            <span className="font-semibold text-slate-900">画像说明：</span>
            {profileExplanation}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => submitFeedback({ nextAccepted: true })}
            disabled={isSubmitting || hasSavedFeedback}
            className="min-h-10 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            采纳
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedRejectLabel}
              onChange={(event) =>
                setSelectedRejectLabel(event.target.value as RejectLabelValue)
              }
              disabled={isSubmitting || hasSavedFeedback}
              className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {rejectLabels.map((label) => (
                <option key={label.value} value={label.value}>
                  {label.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                submitFeedback({
                  nextAccepted: false,
                  nextRejectLabel: selectedRejectLabel
                })
              }
              disabled={isSubmitting || hasSavedFeedback}
              className="min-h-10 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              不采纳
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {isSubmitting
            ? "正在保存反馈..."
            : error
              ? error
              : status === "accepted"
                ? "已采纳，表达会进入个人表达库。"
                : status === "rejected"
                  ? "已记录不采纳原因。"
                  : "选择后会更新你的写作画像。"}
        </p>
      </div>
    </article>
  );
}

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
  onAccepted
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

  return (
    <IslandCard className="p-4 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-[18px] bg-[#fffdf4] p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-normal text-[#9a835a]">
            原句
          </p>
          <p className="text-sm leading-6 text-[#3f3426]">{originalSentence}</p>
        </div>
        <div className="rounded-[18px] border-2 border-[#82d5bb]/35 bg-[#82d5bb]/15 p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-normal text-[#14866d]">
            建议表达
          </p>
          <p className="text-sm leading-6 text-[#3f3426]">{suggestedSentence}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm leading-6 text-[#725d42]">
        <p>
          <span className="font-black text-[#3f3426]">修改理由：</span>
          {reason}
        </p>
        {profileExplanation ? (
          <p>
            <span className="font-black text-[#3f3426]">画像说明：</span>
            {profileExplanation}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t-2 border-[#725d42]/10 pt-4 md:flex-row md:items-center md:justify-between">
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
        <p className="text-sm text-[#725d42]">
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
    </IslandCard>
  );
}

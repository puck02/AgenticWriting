"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

import { SuggestionCard } from "@/components/SuggestionCard";
import type { RejectLabelValue } from "@/domain/labels";

export type InteractiveEssaySuggestion = {
  id: string;
  originalSentence: string;
  suggestedSentence: string;
  reason: string;
  profileExplanation?: string | null;
  accepted?: boolean | null;
  rejectLabel?: RejectLabelValue | null;
};

type ReviewSegment =
  | {
      type: "text";
      text: string;
      key: string;
    }
  | {
      type: "suggestion";
      key: string;
      suggestion: InteractiveEssaySuggestion;
      originalText: string;
    };

type MatchRange = {
  start: number;
  end: number;
};

type SuggestionFeedbackStatus = "pending" | "accepted" | "rejected";
type SuggestionFilter = "all" | SuggestionFeedbackStatus;

const suggestionFilters: Array<{ value: SuggestionFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待处理" },
  { value: "accepted", label: "已采纳" },
  { value: "rejected", label: "不采纳" }
];

export function InteractiveEssayReview({
  essayId,
  content,
  suggestions
}: {
  essayId: string;
  content: string;
  suggestions: InteractiveEssaySuggestion[];
}) {
  const segments = useMemo(
    () => buildReviewSegments(content, suggestions),
    [content, suggestions]
  );
  const [feedbackStatuses, setFeedbackStatuses] = useState(
    () =>
      new Map(
        suggestions.map((suggestion) => [
          suggestion.id,
          getInitialFeedbackStatus(suggestion)
        ])
      )
  );
  const [freshSuggestionId, setFreshSuggestionId] = useState<string | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(
    null
  );
  const [activeFilter, setActiveFilter] = useState<SuggestionFilter>("all");
  const progressCounts = useMemo(
    () => countSuggestionStatuses(suggestions, feedbackStatuses),
    [feedbackStatuses, suggestions]
  );
  const completedCount = progressCounts.accepted + progressCounts.rejected;
  const progressPercent =
    suggestions.length > 0
      ? Math.round((completedCount / suggestions.length) * 100)
      : 0;
  const visibleSuggestions = suggestions.filter((suggestion) => {
    if (activeFilter === "all") {
      return true;
    }

    return getFeedbackStatus(feedbackStatuses, suggestion) === activeFilter;
  });
  const pendingSuggestions = suggestions.filter(
    (suggestion) => getFeedbackStatus(feedbackStatuses, suggestion) === "pending"
  );
  const activeSuggestion =
    suggestions.find((suggestion) => suggestion.id === activeSuggestionId) ??
    pendingSuggestions[0] ??
    suggestions[0] ??
    null;
  const activeSuggestionStatus = activeSuggestion
    ? getFeedbackStatus(feedbackStatuses, activeSuggestion)
    : "pending";

  function saveFeedbackStatus({
    suggestionId,
    accepted
  }: {
    suggestionId: string;
    accepted: boolean;
  }) {
    setFeedbackStatuses((currentStatuses) => {
      const nextStatuses = new Map(currentStatuses);
      nextStatuses.set(suggestionId, accepted ? "accepted" : "rejected");
      return nextStatuses;
    });
    setFreshSuggestionId(accepted ? suggestionId : null);
    setActiveSuggestionId(suggestionId);
  }

  function activateSuggestion({
    suggestionId,
    shouldScroll = false
  }: {
    suggestionId: string;
    shouldScroll?: boolean;
  }) {
    setActiveSuggestionId(suggestionId);

    if (shouldScroll) {
      const targetCard = document.getElementById(
        `review-suggestion-card-${suggestionId}`
      );

      if (typeof targetCard?.scrollIntoView === "function") {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function activateNextPendingSuggestion() {
    if (pendingSuggestions.length === 0) {
      return;
    }

    const activePendingIndex = pendingSuggestions.findIndex(
      (suggestion) => suggestion.id === activeSuggestionId
    );
    const nextIndex =
      activePendingIndex >= 0
        ? (activePendingIndex + 1) % pendingSuggestions.length
        : 0;

    activateSuggestion({
      suggestionId: pendingSuggestions[nextIndex].id,
      shouldScroll: true
    });
  }

  function handleWorkflowKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    const navigableSuggestions =
      visibleSuggestions.length > 0 ? visibleSuggestions : suggestions;

    if (navigableSuggestions.length === 0) {
      return;
    }

    event.preventDefault();
    const activeIndex = navigableSuggestions.findIndex(
      (suggestion) => suggestion.id === activeSuggestionId
    );
    const fallbackIndex = event.key === "ArrowDown" ? -1 : 0;
    const currentIndex = activeIndex >= 0 ? activeIndex : fallbackIndex;
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + navigableSuggestions.length) %
      navigableSuggestions.length;

    activateSuggestion({
      suggestionId: navigableSuggestions[nextIndex].id,
      shouldScroll: true
    });
  }

  return (
    <section
      data-testid="review-workflow"
      tabIndex={0}
      aria-label="逐句建议工作流"
      onKeyDown={handleWorkflowKeyDown}
      className="review-coach-workflow mt-6"
    >
      <aside className="review-source-pane lg:sticky lg:top-4 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <h2 className="review-pane-title">原文</h2>
          <span className="review-soft-badge">
            可点击定位
          </span>
        </div>
        <p className="review-essay-body mt-3 whitespace-pre-wrap text-sm leading-7">
          {segments.map((segment) => {
            if (segment.type === "text") {
              return <span key={segment.key}>{segment.text}</span>;
            }

            const feedbackStatus = getFeedbackStatus(
              feedbackStatuses,
              segment.suggestion
            );
            const isAccepted = feedbackStatus === "accepted";
            const isActive = activeSuggestionId === segment.suggestion.id;

            return (
              <button
                type="button"
                key={segment.key}
                data-testid={`review-sentence-${segment.suggestion.id}`}
                aria-pressed={isActive}
                aria-label={`建议句，${getFeedbackStatusLabel(feedbackStatus)}`}
                aria-controls={`review-suggestion-card-${segment.suggestion.id}`}
                className={[
                  "review-sentence",
                  `review-sentence-${feedbackStatus}`,
                  isActive ? "review-sentence-active" : "",
                  freshSuggestionId === segment.suggestion.id
                    ? "review-sentence-fresh"
                    : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  activateSuggestion({
                    suggestionId: segment.suggestion.id,
                    shouldScroll: true
                  })
                }
              >
                {isAccepted
                  ? segment.suggestion.suggestedSentence
                  : segment.originalText}
              </button>
            );
          })}
        </p>
      </aside>

      <div className="review-learning-pane">
        <div className="review-toolbar">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="coach-eyebrow">学习路径</p>
              <h2 className="review-pane-title">逐句建议</h2>
              <p
                data-testid="review-progress-summary"
                className="mt-1 text-sm leading-6 text-[var(--aw-text-muted)]"
              >
                待处理 {progressCounts.pending} / 已采纳 {progressCounts.accepted} /
                不采纳 {progressCounts.rejected}
              </p>
            </div>
            <span className="review-progress-badge">
              {completedCount}/{suggestions.length} 已反馈
            </span>
          </div>

          <div
            className="review-progress-track mt-3"
            aria-hidden="true"
          >
            <div
              className="review-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="learning-path-steps" aria-label="学习路径">
            <span>1 理解问题</span>
            <span>2 对照改写</span>
            <span>3 迁移练习</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {suggestionFilters.map((filter) => {
              const isSelected = activeFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-label={`筛选${filter.label}`}
                  aria-pressed={isSelected}
                  className={[
                    "review-filter-button",
                    isSelected ? "review-filter-button-active" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setActiveFilter(filter.value)}
                >
                  <span>{filter.label}</span>
                  <span>
                    {getFilterCount(filter.value, progressCounts, suggestions.length)}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              className="review-filter-button review-action-button"
              disabled={pendingSuggestions.length === 0}
              onClick={activateNextPendingSuggestion}
            >
              下一条待处理
            </button>
          </div>

          {activeSuggestion ? (
            <div className="active-lesson-panel mt-4">
              <div>
                <p className="coach-eyebrow">主动 lesson</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--aw-text)]">
                  {activeSuggestion.reason}
                </p>
              </div>
              <div className="active-lesson-rewrite">
                <p className="text-xs font-semibold text-[var(--aw-text-muted)]">
                  建议表达
                </p>
                <p>{activeSuggestion.suggestedSentence}</p>
              </div>
              <p className="text-sm leading-6 text-[var(--aw-text-muted)]">
                先理解，再决定是否采纳。当前状态：
                {getFeedbackStatusLabel(activeSuggestionStatus)}
              </p>
            </div>
          ) : null}

          <div
            className="review-mini-map mt-4"
            aria-label="建议定位导航"
          >
            {suggestions.map((suggestion, index) => {
              const feedbackStatus = getFeedbackStatus(
                feedbackStatuses,
                suggestion
              );
              const isActive = activeSuggestionId === suggestion.id;

              return (
                <button
                  key={suggestion.id}
                  type="button"
                  aria-label={`定位建议 ${index + 1}，${getFeedbackStatusLabel(
                    feedbackStatus
                  )}`}
                  aria-pressed={isActive}
                  className={[
                    "review-mini-map-dot",
                    `review-mini-map-dot-${feedbackStatus}`,
                    isActive ? "review-mini-map-dot-active" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() =>
                    activateSuggestion({
                      suggestionId: suggestion.id,
                      shouldScroll: true
                    })
                  }
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-4">
          {visibleSuggestions.length > 0 ? (
            visibleSuggestions.map((suggestion) => {
              const feedbackStatus = getFeedbackStatus(
                feedbackStatuses,
                suggestion
              );

              return (
                <SuggestionCard
                  key={suggestion.id}
                  essayId={essayId}
                  suggestionId={suggestion.id}
                  originalSentence={suggestion.originalSentence}
                  suggestedSentence={suggestion.suggestedSentence}
                  reason={suggestion.reason}
                  profileExplanation={suggestion.profileExplanation}
                  accepted={
                    feedbackStatus === "accepted"
                      ? true
                      : feedbackStatus === "rejected"
                        ? false
                        : null
                  }
                  rejectLabel={suggestion.rejectLabel}
                  onFeedbackSaved={(suggestionId, accepted) =>
                    saveFeedbackStatus({ suggestionId, accepted })
                  }
                  isActive={activeSuggestionId === suggestion.id}
                  onActivate={(suggestionId) =>
                    activateSuggestion({ suggestionId })
                  }
                />
              );
            })
          ) : (
            <p className="writing-panel p-4 text-sm text-[var(--aw-text-muted)]">
              当前筛选下暂无逐句建议。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function getInitialFeedbackStatus(
  suggestion: InteractiveEssaySuggestion
): SuggestionFeedbackStatus {
  if (suggestion.accepted === true) {
    return "accepted";
  }

  if (suggestion.accepted === false) {
    return "rejected";
  }

  return "pending";
}

function getFeedbackStatus(
  feedbackStatuses: Map<string, SuggestionFeedbackStatus>,
  suggestion: InteractiveEssaySuggestion
) {
  return feedbackStatuses.get(suggestion.id) ?? getInitialFeedbackStatus(suggestion);
}

function countSuggestionStatuses(
  suggestions: InteractiveEssaySuggestion[],
  feedbackStatuses: Map<string, SuggestionFeedbackStatus>
) {
  return suggestions.reduce(
    (counts, suggestion) => {
      counts[getFeedbackStatus(feedbackStatuses, suggestion)] += 1;
      return counts;
    },
    { pending: 0, accepted: 0, rejected: 0 }
  );
}

function getFilterCount(
  filter: SuggestionFilter,
  counts: Record<SuggestionFeedbackStatus, number>,
  total: number
) {
  if (filter === "all") {
    return total;
  }

  return counts[filter];
}

function getFeedbackStatusLabel(status: SuggestionFeedbackStatus) {
  if (status === "accepted") {
    return "已采纳";
  }

  if (status === "rejected") {
    return "不采纳";
  }

  return "待处理";
}

function buildReviewSegments(
  content: string,
  suggestions: InteractiveEssaySuggestion[]
): ReviewSegment[] {
  const usedRanges: MatchRange[] = [];
  const matches = suggestions
    .map((suggestion) => {
      const match = findAvailableSentenceMatch(
        content,
        suggestion.originalSentence,
        usedRanges
      );

      if (!match) {
        return null;
      }

      usedRanges.push({ start: match.start, end: match.end });
      return {
        ...match,
        suggestion
      };
    })
    .filter((match): match is MatchRange & {
      suggestion: InteractiveEssaySuggestion;
    } => match !== null)
    .sort((left, right) => left.start - right.start);

  const segments: ReviewSegment[] = [];
  let cursor = 0;

  matches.forEach((match) => {
    if (match.start > cursor) {
      segments.push({
        type: "text",
        text: content.slice(cursor, match.start),
        key: `text-${cursor}-${match.start}`
      });
    }

    segments.push({
      type: "suggestion",
      key: `suggestion-${match.suggestion.id}`,
      suggestion: match.suggestion,
      originalText: content.slice(match.start, match.end)
    });
    cursor = match.end;
  });

  if (cursor < content.length) {
    segments.push({
      type: "text",
      text: content.slice(cursor),
      key: `text-${cursor}-end`
    });
  }

  return segments;
}

function findAvailableSentenceMatch(
  content: string,
  originalSentence: string,
  usedRanges: MatchRange[]
): MatchRange | null {
  const candidateSentences = Array.from(
    new Set([originalSentence, originalSentence.trim()])
  ).filter((sentence) => sentence.length > 0);

  for (const sentence of candidateSentences) {
    let start = content.indexOf(sentence);

    while (start >= 0) {
      const end = start + sentence.length;

      if (!usedRanges.some((range) => rangesOverlap(range, { start, end }))) {
        return { start, end };
      }

      start = content.indexOf(sentence, start + sentence.length);
    }
  }

  return null;
}

function rangesOverlap(left: MatchRange, right: MatchRange) {
  return left.start < right.end && right.start < left.end;
}

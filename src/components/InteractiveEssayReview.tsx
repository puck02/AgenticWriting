"use client";

import { useMemo, useState } from "react";

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
  const [acceptedSuggestionIds, setAcceptedSuggestionIds] = useState(
    () =>
      new Set(
        suggestions
          .filter((suggestion) => suggestion.accepted === true)
          .map((suggestion) => suggestion.id)
      )
  );
  const [freshSuggestionId, setFreshSuggestionId] = useState<string | null>(null);

  function handleAccepted(suggestionId: string) {
    setAcceptedSuggestionIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(suggestionId);
      return nextIds;
    });
    setFreshSuggestionId(suggestionId);
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">原文</h2>
        <p className="review-essay-body mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {segments.map((segment) => {
            if (segment.type === "text") {
              return <span key={segment.key}>{segment.text}</span>;
            }

            const isAccepted = acceptedSuggestionIds.has(segment.suggestion.id);

            return (
              <span
                key={segment.key}
                data-testid={`review-sentence-${segment.suggestion.id}`}
                className={[
                  "review-sentence",
                  isAccepted
                    ? "review-sentence-accepted"
                    : "review-sentence-pending",
                  freshSuggestionId === segment.suggestion.id
                    ? "review-sentence-fresh"
                    : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {isAccepted
                  ? segment.suggestion.suggestedSentence
                  : segment.originalText}
              </span>
            );
          })}
        </p>
      </aside>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">逐句建议</h2>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-600">
            {suggestions.length} 条
          </span>
        </div>
        <div className="space-y-4">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                essayId={essayId}
                suggestionId={suggestion.id}
                originalSentence={suggestion.originalSentence}
                suggestedSentence={suggestion.suggestedSentence}
                reason={suggestion.reason}
                profileExplanation={suggestion.profileExplanation}
                accepted={suggestion.accepted}
                rejectLabel={suggestion.rejectLabel}
                onAccepted={handleAccepted}
              />
            ))
          ) : (
            <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
              暂无逐句建议。
            </p>
          )}
        </div>
      </div>
    </section>
  );
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

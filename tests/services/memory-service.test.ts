import { describe, expect, it } from "vitest";

import type { MemorySnapshot, SuggestionFeedback } from "@/domain/memory";
import {
  applyFeedbackToMemory,
  filterActiveMemory,
  rankMemoryForReview
} from "@/services/memory/memory-service";

const emptyMemory = (): MemorySnapshot => ({
  preferences: [],
  errorPatterns: [],
  expressions: []
});

const acceptedFeedback: SuggestionFeedback = {
  userId: "user-1",
  essayType: "ENGLISH_ONE_PICTURE",
  preferenceLabel: "句式更简洁",
  originalSentence: "The chart tells us a lot.",
  optimizedSentence: "The chart reveals a clear trend.",
  topic: "education",
  expressionIntent: "describe trend",
  accepted: true
};

describe("memory service", () => {
  it("accepted feedback increments preference and adds an expression asset", () => {
    const memory: MemorySnapshot = {
      ...emptyMemory(),
      preferences: [
        {
          id: "preference-1",
          label: "句式更简洁",
          essayType: "ENGLISH_ONE_PICTURE",
          acceptCount: 2,
          rejectCount: 1
        }
      ]
    };

    const updated = applyFeedbackToMemory(memory, acceptedFeedback);

    expect(updated.preferences).toEqual([
      {
        id: "preference-1",
        label: "句式更简洁",
        essayType: "ENGLISH_ONE_PICTURE",
        acceptCount: 3,
        rejectCount: 1
      }
    ]);
    expect(updated.expressions).toEqual([
      {
        id: expect.any(String),
        essayType: "ENGLISH_ONE_PICTURE",
        topic: "education",
        expressionIntent: "describe trend",
        optimizedSentence: "The chart reveals a clear trend.",
        reuseCount: 0
      }
    ]);
  });

  it("rejected feedback increments preference and does not add an expression asset", () => {
    const feedback: SuggestionFeedback = {
      ...acceptedFeedback,
      accepted: false,
      rejectLabel: "NOT_MY_STYLE"
    };

    const updated = applyFeedbackToMemory(emptyMemory(), feedback);

    expect(updated.preferences).toEqual([
      {
        id: expect.any(String),
        label: "句式更简洁",
        essayType: "ENGLISH_ONE_PICTURE",
        acceptCount: 0,
        rejectCount: 1
      }
    ]);
    expect(updated.expressions).toEqual([]);
  });

  it("filters out deleted memory entries", () => {
    const memory: MemorySnapshot = {
      preferences: [
        {
          id: "active-preference",
          label: "保留",
          essayType: "ENGLISH_ONE_PICTURE",
          acceptCount: 1,
          rejectCount: 0
        },
        {
          id: "deleted-preference",
          label: "删除",
          essayType: "ENGLISH_ONE_PICTURE",
          acceptCount: 1,
          rejectCount: 0,
          deletedAt: new Date("2026-01-01T00:00:00Z")
        }
      ],
      errorPatterns: [
        {
          id: "active-error",
          label: "保留错误",
          essayType: "ENGLISH_ONE_PICTURE",
          count: 2
        },
        {
          id: "deleted-error",
          label: "删除错误",
          essayType: "ENGLISH_ONE_PICTURE",
          count: 2,
          deletedAt: new Date("2026-01-01T00:00:00Z")
        }
      ],
      expressions: [
        {
          id: "active-expression",
          essayType: "ENGLISH_ONE_PICTURE",
          topic: "education",
          expressionIntent: "describe trend",
          optimizedSentence: "The chart reveals a clear trend.",
          reuseCount: 0
        },
        {
          id: "deleted-expression",
          essayType: "ENGLISH_ONE_PICTURE",
          topic: "education",
          expressionIntent: "describe trend",
          optimizedSentence: "The chart reveals a clear trend.",
          reuseCount: 0,
          deletedAt: new Date("2026-01-01T00:00:00Z")
        }
      ]
    };

    const filtered = filterActiveMemory(memory);

    expect(filtered.preferences.map((preference) => preference.id)).toEqual([
      "active-preference"
    ]);
    expect(filtered.errorPatterns.map((pattern) => pattern.id)).toEqual([
      "active-error"
    ]);
    expect(filtered.expressions.map((expression) => expression.id)).toEqual([
      "active-expression"
    ]);
  });

  it("ranks same essay type memory before different essay type memory", () => {
    const memory: MemorySnapshot = {
      preferences: [
        {
          id: "preference-other",
          label: "不同题型",
          essayType: "ENGLISH_TWO_CHART",
          acceptCount: 3,
          rejectCount: 0
        },
        {
          id: "preference-same",
          label: "同题型",
          essayType: "ENGLISH_ONE_PICTURE",
          acceptCount: 1,
          rejectCount: 0
        }
      ],
      errorPatterns: [
        {
          id: "error-other",
          label: "不同题型错误",
          essayType: "ENGLISH_TWO_CHART",
          count: 3
        },
        {
          id: "error-same",
          label: "同题型错误",
          essayType: "ENGLISH_ONE_PICTURE",
          count: 1
        }
      ],
      expressions: [
        {
          id: "expression-other",
          essayType: "ENGLISH_TWO_CHART",
          topic: "work",
          expressionIntent: "compare",
          optimizedSentence: "The figures differ sharply.",
          reuseCount: 1
        },
        {
          id: "expression-same",
          essayType: "ENGLISH_ONE_PICTURE",
          topic: "education",
          expressionIntent: "describe trend",
          optimizedSentence: "The chart reveals a clear trend.",
          reuseCount: 0
        }
      ]
    };

    const ranked = rankMemoryForReview({
      memory,
      essayType: "ENGLISH_ONE_PICTURE"
    });

    expect(ranked.preferences.map((preference) => preference.id)).toEqual([
      "preference-same",
      "preference-other"
    ]);
    expect(ranked.errorPatterns.map((pattern) => pattern.id)).toEqual([
      "error-same",
      "error-other"
    ]);
    expect(ranked.expressions.map((expression) => expression.id)).toEqual([
      "expression-same",
      "expression-other"
    ]);
  });
});

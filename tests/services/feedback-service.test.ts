import { describe, expect, it, vi } from "vitest";

import { recordSuggestionResponse } from "@/services/feedback/feedback-service";

const acceptedSuggestion = {
  id: "suggestion-1",
  topic: "reading",
  expressionIntent: "说明阅读价值",
  originalSentence: "People should read more books.",
  suggestedSentence:
    "People can build stronger judgment by reading more books."
};

describe("recordSuggestionResponse", () => {
  it("does not create a duplicate expression asset when the same suggestion is accepted again", async () => {
    const tx = {
      reviewSuggestion: {
        update: vi.fn().mockResolvedValue({})
      },
      expressionAsset: {
        findFirst: vi.fn().mockResolvedValue({ id: "expression-1" }),
        create: vi.fn().mockResolvedValue({})
      }
    };
    const db = {
      $transaction: vi.fn(async (callback) => callback(tx))
    };

    await recordSuggestionResponse({
      db,
      userId: "user-1",
      essayType: "ENGLISH_ONE_PICTURE",
      suggestion: acceptedSuggestion,
      accepted: true
    });

    expect(tx.reviewSuggestion.update).toHaveBeenCalledWith({
      where: { id: "suggestion-1" },
      data: {
        accepted: true,
        rejectLabel: null
      }
    });
    expect(tx.expressionAsset.findFirst).toHaveBeenCalledOnce();
    expect(tx.expressionAsset.create).not.toHaveBeenCalled();
  });

  it("creates an expression asset for a first accepted suggestion", async () => {
    const tx = {
      reviewSuggestion: {
        update: vi.fn().mockResolvedValue({})
      },
      expressionAsset: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({})
      }
    };
    const db = {
      $transaction: vi.fn(async (callback) => callback(tx))
    };

    await recordSuggestionResponse({
      db,
      userId: "user-1",
      essayType: "ENGLISH_ONE_PICTURE",
      suggestion: {
        ...acceptedSuggestion
      },
      accepted: true
    });

    expect(tx.expressionAsset.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        essayType: "ENGLISH_ONE_PICTURE",
        topic: "reading",
        expressionIntent: "说明阅读价值",
        originalSentence: "People should read more books.",
        optimizedSentence:
          "People can build stronger judgment by reading more books."
      }
    });
  });
});

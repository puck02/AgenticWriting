import { describe, expect, it, vi } from "vitest";

import { recordSuggestionResponse } from "@/services/feedback/feedback-service";

const acceptedSuggestion = {
  id: "suggestion-1",
  topic: "reading",
  preferenceLabel: "句式更有判断力",
  expressionIntent: "说明阅读价值",
  originalSentence: "People should read more books.",
  suggestedSentence:
    "People can build stronger judgment by reading more books."
};

function createDb(overrides?: {
  existingExpression?: unknown;
  stateChangeCount?: number;
}) {
  const tx = {
    reviewSuggestion: {
      updateMany: vi
        .fn()
        .mockResolvedValue({ count: overrides?.stateChangeCount ?? 1 }),
      update: vi.fn().mockResolvedValue({})
    },
    expressionAsset: {
      findFirst: vi.fn().mockResolvedValue(overrides?.existingExpression ?? null),
      create: vi.fn().mockResolvedValue({})
    },
    writingPreference: {
      upsert: vi.fn().mockResolvedValue({})
    }
  };
  const db = {
    $transaction: vi.fn(async (callback) => callback(tx))
  };

  return { db, tx };
}

describe("recordSuggestionResponse", () => {
  it("increments the preference accept count when a suggestion is accepted for the first time", async () => {
    const { db, tx } = createDb({ existingExpression: { id: "expression-1" } });

    await recordSuggestionResponse({
      db,
      userId: "user-1",
      essayType: "ENGLISH_ONE_PICTURE",
      suggestion: acceptedSuggestion,
      accepted: true
    });

    expect(tx.reviewSuggestion.updateMany).toHaveBeenCalledWith({
      where: {
        id: "suggestion-1",
        OR: [{ accepted: null }, { accepted: false }]
      },
      data: {
        accepted: true,
        rejectLabel: null
      }
    });
    expect(tx.writingPreference.upsert).toHaveBeenCalledWith({
      where: {
        userId_label_essayType: {
          userId: "user-1",
          label: "句式更有判断力",
          essayType: "ENGLISH_ONE_PICTURE"
        }
      },
      create: {
        userId: "user-1",
        label: "句式更有判断力",
        essayType: "ENGLISH_ONE_PICTURE",
        acceptCount: 1,
        rejectCount: 0
      },
      update: {
        acceptCount: { increment: 1 },
        deletedAt: null
      }
    });
  });

  it("does not run preference or expression side effects when the suggestion state is unchanged in the transaction", async () => {
    const { db, tx } = createDb({
      existingExpression: { id: "expression-1" },
      stateChangeCount: 0
    });

    await recordSuggestionResponse({
      db,
      userId: "user-1",
      essayType: "ENGLISH_ONE_PICTURE",
      suggestion: acceptedSuggestion,
      accepted: true
    });

    expect(tx.reviewSuggestion.updateMany).toHaveBeenCalledWith({
      where: {
        id: "suggestion-1",
        OR: [{ accepted: null }, { accepted: false }]
      },
      data: {
        accepted: true,
        rejectLabel: null
      }
    });
    expect(tx.reviewSuggestion.update).toHaveBeenCalledWith({
      where: { id: "suggestion-1" },
      data: {
        accepted: true,
        rejectLabel: null
      }
    });
    expect(tx.writingPreference.upsert).not.toHaveBeenCalled();
    expect(tx.expressionAsset.findFirst).not.toHaveBeenCalled();
    expect(tx.expressionAsset.create).not.toHaveBeenCalled();
  });

  it("requires a reject label before recording rejected feedback", async () => {
    const { db, tx } = createDb();

    await expect(
      recordSuggestionResponse({
        db,
        userId: "user-1",
        essayType: "ENGLISH_ONE_PICTURE",
        suggestion: acceptedSuggestion,
        accepted: false
      })
    ).rejects.toThrow("rejectLabel is required when accepted is false");

    expect(db.$transaction).not.toHaveBeenCalled();
    expect(tx.reviewSuggestion.updateMany).not.toHaveBeenCalled();
    expect(tx.reviewSuggestion.update).not.toHaveBeenCalled();
  });

  it("increments the preference reject count without creating an expression asset when a suggestion is rejected for the first time", async () => {
    const { db, tx } = createDb();

    await recordSuggestionResponse({
      db,
      userId: "user-1",
      essayType: "ENGLISH_ONE_PICTURE",
      suggestion: acceptedSuggestion,
      accepted: false,
      rejectLabel: "NOT_MY_STYLE"
    });

    expect(tx.reviewSuggestion.updateMany).toHaveBeenCalledWith({
      where: {
        id: "suggestion-1",
        OR: [{ accepted: null }, { accepted: true }]
      },
      data: {
        accepted: false,
        rejectLabel: "NOT_MY_STYLE"
      }
    });
    expect(tx.writingPreference.upsert).toHaveBeenCalledWith({
      where: {
        userId_label_essayType: {
          userId: "user-1",
          label: "句式更有判断力",
          essayType: "ENGLISH_ONE_PICTURE"
        }
      },
      create: {
        userId: "user-1",
        label: "句式更有判断力",
        essayType: "ENGLISH_ONE_PICTURE",
        acceptCount: 0,
        rejectCount: 1
      },
      update: {
        rejectCount: { increment: 1 },
        deletedAt: null
      }
    });
    expect(tx.expressionAsset.findFirst).not.toHaveBeenCalled();
    expect(tx.expressionAsset.create).not.toHaveBeenCalled();
  });

  it("increments only accept count when feedback changes from rejected to accepted", async () => {
    const { db, tx } = createDb({ existingExpression: { id: "expression-1" } });

    await recordSuggestionResponse({
      db,
      userId: "user-1",
      essayType: "ENGLISH_ONE_PICTURE",
      suggestion: acceptedSuggestion,
      accepted: true
    });

    expect(tx.reviewSuggestion.updateMany).toHaveBeenCalledWith({
      where: {
        id: "suggestion-1",
        OR: [{ accepted: null }, { accepted: false }]
      },
      data: {
        accepted: true,
        rejectLabel: null
      }
    });
    expect(tx.writingPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          acceptCount: { increment: 1 },
          deletedAt: null
        }
      })
    );
  });

  it("increments only reject count when feedback changes from accepted to rejected", async () => {
    const { db, tx } = createDb();

    await recordSuggestionResponse({
      db,
      userId: "user-1",
      essayType: "ENGLISH_ONE_PICTURE",
      suggestion: acceptedSuggestion,
      accepted: false,
      rejectLabel: "NOT_MY_STYLE"
    });

    expect(tx.reviewSuggestion.updateMany).toHaveBeenCalledWith({
      where: {
        id: "suggestion-1",
        OR: [{ accepted: null }, { accepted: true }]
      },
      data: {
        accepted: false,
        rejectLabel: "NOT_MY_STYLE"
      }
    });
    expect(tx.writingPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          rejectCount: { increment: 1 },
          deletedAt: null
        }
      })
    );
  });

  it("does not create a duplicate expression asset when the same suggestion is accepted again", async () => {
    const { db, tx } = createDb({ existingExpression: { id: "expression-1" } });

    await recordSuggestionResponse({
      db,
      userId: "user-1",
      essayType: "ENGLISH_ONE_PICTURE",
      suggestion: acceptedSuggestion,
      accepted: true
    });

    expect(tx.reviewSuggestion.updateMany).toHaveBeenCalledWith({
      where: {
        id: "suggestion-1",
        OR: [{ accepted: null }, { accepted: false }]
      },
      data: {
        accepted: true,
        rejectLabel: null
      }
    });
    expect(tx.expressionAsset.findFirst).toHaveBeenCalledOnce();
    expect(tx.expressionAsset.create).not.toHaveBeenCalled();
  });

  it("creates an expression asset for a first accepted suggestion", async () => {
    const { db, tx } = createDb();

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

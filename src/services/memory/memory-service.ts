import type {
  MemorySnapshot,
  SuggestionFeedback
} from "@/domain/memory";
import type { EssayTypeValue } from "@/domain/labels";

type Preference = MemorySnapshot["preferences"][number];
type ErrorPattern = MemorySnapshot["errorPatterns"][number];
type Expression = MemorySnapshot["expressions"][number];

export function applyFeedbackToMemory(
  memory: MemorySnapshot,
  feedback: SuggestionFeedback
): MemorySnapshot {
  const preferenceIndex = memory.preferences.findIndex(
    (preference) =>
      preference.label === feedback.preferenceLabel &&
      preference.essayType === feedback.essayType
  );
  const preferences = [...memory.preferences];

  if (preferenceIndex >= 0) {
    const preference = preferences[preferenceIndex];
    preferences[preferenceIndex] = {
      ...preference,
      acceptCount: feedback.accepted
        ? preference.acceptCount + 1
        : preference.acceptCount,
      rejectCount: feedback.accepted
        ? preference.rejectCount
        : preference.rejectCount + 1
    };
  } else {
    preferences.push({
      id: createMemoryId("preference"),
      label: feedback.preferenceLabel,
      essayType: feedback.essayType,
      acceptCount: feedback.accepted ? 1 : 0,
      rejectCount: feedback.accepted ? 0 : 1
    });
  }

  return {
    ...memory,
    preferences,
    expressions: feedback.accepted
      ? [
          ...memory.expressions,
          {
            id: createMemoryId("expression"),
            essayType: feedback.essayType,
            topic: feedback.topic,
            expressionIntent: feedback.expressionIntent,
            optimizedSentence: feedback.optimizedSentence,
            reuseCount: 0
          }
        ]
      : memory.expressions
  };
}

export function filterActiveMemory(memory: MemorySnapshot): MemorySnapshot {
  return {
    preferences: memory.preferences.filter(isActive),
    errorPatterns: memory.errorPatterns.filter(isActive),
    expressions: memory.expressions.filter(isActive)
  };
}

export function rankMemoryForReview({
  memory,
  essayType
}: {
  memory: MemorySnapshot;
  essayType: EssayTypeValue;
}): MemorySnapshot {
  return {
    preferences: rankByEssayType(memory.preferences, essayType),
    errorPatterns: rankByEssayType(memory.errorPatterns, essayType),
    expressions: rankByEssayType(memory.expressions, essayType)
  };
}

function isActive<T extends { deletedAt?: Date | null }>(entry: T): boolean {
  return !entry.deletedAt;
}

function rankByEssayType<T extends Preference | ErrorPattern | Expression>(
  entries: T[],
  essayType: EssayTypeValue
): T[] {
  return [...entries].sort((left, right) => {
    const leftMatches = left.essayType === essayType;
    const rightMatches = right.essayType === essayType;

    if (leftMatches === rightMatches) {
      return 0;
    }

    return leftMatches ? -1 : 1;
  });
}

function createMemoryId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

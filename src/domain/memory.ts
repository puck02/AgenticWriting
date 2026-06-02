import type { EssayTypeValue, RejectLabelValue } from "./labels";

export type MemorySnapshot = {
  preferences: Array<{
    id: string;
    label: string;
    acceptCount: number;
    rejectCount: number;
    essayType: EssayTypeValue | null;
    deletedAt?: Date | null;
  }>;
  errorPatterns: Array<{
    id: string;
    label: string;
    count: number;
    essayType: EssayTypeValue | null;
    deletedAt?: Date | null;
  }>;
  expressions: Array<{
    id: string;
    essayType: EssayTypeValue;
    topic: string;
    expressionIntent: string;
    optimizedSentence: string;
    reuseCount: number;
    deletedAt?: Date | null;
  }>;
};

type BaseSuggestionFeedback = {
  userId: string;
  essayType: EssayTypeValue;
  preferenceLabel: string;
  originalSentence: string;
  optimizedSentence: string;
  topic: string;
  expressionIntent: string;
};

export type SuggestionFeedback =
  | (BaseSuggestionFeedback & {
      accepted: true;
      rejectLabel?: never;
    })
  | (BaseSuggestionFeedback & {
      accepted: false;
      rejectLabel: RejectLabelValue;
    });

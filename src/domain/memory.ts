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

export type SuggestionFeedback = {
  userId: string;
  essayType: EssayTypeValue;
  accepted: boolean;
  rejectLabel?: RejectLabelValue;
  preferenceLabel: string;
  originalSentence: string;
  optimizedSentence: string;
  topic: string;
  expressionIntent: string;
};

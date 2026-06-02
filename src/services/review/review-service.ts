import type { EssayTypeValue } from "@/domain/labels";
import type { MemorySnapshot } from "@/domain/memory";
import { reviewResultSchema } from "@/domain/review-schema";
import type { LlmReviewer } from "@/services/review/llm-reviewer";
import { rankMemoryForReview } from "@/services/memory/memory-service";

export async function reviewEssayDraft({
  reviewer,
  essayType,
  prompt,
  content,
  memory
}: {
  reviewer: LlmReviewer;
  essayType: EssayTypeValue;
  prompt: string;
  content: string;
  memory: MemorySnapshot;
}) {
  const rankedMemory = rankMemoryForReview({ memory, essayType });
  const review = await reviewer.reviewEssay({
    essayType,
    prompt,
    content,
    memory: rankedMemory
  });

  return reviewResultSchema.parse(review);
}

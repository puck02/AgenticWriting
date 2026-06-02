import type { EssayTypeValue } from "@/domain/labels";
import type { MemorySnapshot } from "@/domain/memory";
import type { ReviewResult } from "@/domain/review-schema";

export type ReviewRequest = {
  essayType: EssayTypeValue;
  prompt: string;
  content: string;
  memory: MemorySnapshot;
};

export interface LlmReviewer {
  reviewEssay(request: ReviewRequest): Promise<ReviewResult>;
}

export class DeterministicReviewer implements LlmReviewer {
  async reviewEssay(request: ReviewRequest): Promise<ReviewResult> {
    const preferenceLabel = nonEmptyOrDefault(
      request.memory.preferences[0]?.label,
      "正式但不过度复杂"
    );
    const originalSentence = inferFirstSentence(request.content);
    const topic = inferTopic(request.prompt);

    return {
      overallScore: 15,
      summary: "文章完成了基本写作任务，结构清晰但细节仍可加强。",
      priority: "优先补充更具体的论据，并保持表达自然。",
      categoryScores: {
        content: 4,
        accuracy: 4,
        richness: 3,
        coherence: 4
      },
      errorPatterns: ["细节支撑不足"],
      suggestions: [
        {
          originalSentence,
          suggestedSentence: `${originalSentence} This point can be supported with a clearer example.`,
          reason: "补充例证可以让论证更充分。",
          expressionIntent: "补充具体论据",
          topic,
          preferenceLabel,
          profileExplanation: preferenceLabel
        }
      ]
    };
  }
}

function nonEmptyOrDefault(value: string | undefined, fallback: string): string {
  const normalizedValue = value?.trim();

  return normalizedValue && normalizedValue.length > 0
    ? normalizedValue
    : fallback;
}

function inferFirstSentence(content: string): string {
  const normalizedContent = content.trim();
  const match = normalizedContent.match(/^[^.!?。！？]+[.!?。！？]?/);

  return match?.[0].trim() || "The essay needs a clearer opening sentence.";
}

function inferTopic(prompt: string): string {
  const normalizedPrompt = prompt.trim();

  return normalizedPrompt || "general writing";
}

import { reviewResultSchema, type ReviewResult } from "@/domain/review-schema";
import type { LlmReviewer, ReviewRequest } from "@/services/review/llm-reviewer";
import type { ModelProvider } from "@/services/review/model-provider";

export class ProductionReviewer implements LlmReviewer {
  constructor({ provider, model }: { provider: Pick<ModelProvider, "completeJson">; model: string }) {
    this.provider = provider;
    this.model = model;
  }

  private readonly provider: Pick<ModelProvider, "completeJson">;
  private readonly model: string;

  async reviewEssay(request: ReviewRequest): Promise<ReviewResult> {
    const firstOutput = await this.provider.completeJson(
      buildReviewPrompt(request, this.model)
    );
    const firstParsed = parseReview(firstOutput);

    if (firstParsed) {
      return firstParsed;
    }

    const repairedOutput = await this.provider.completeJson(
      buildRepairPrompt(firstOutput)
    );
    const repairedParsed = parseReview(repairedOutput);

    if (!repairedParsed) {
      throw new Error("Model output did not match review schema");
    }

    return repairedParsed;
  }
}

function parseReview(output: string): ReviewResult | null {
  try {
    return reviewResultSchema.parse(JSON.parse(output));
  } catch {
    return null;
  }
}

function buildReviewPrompt(request: ReviewRequest, model: string): string {
  return [
    `You are using model ${model} as an expert coach for Chinese postgraduate English writing.`,
    "Return only valid JSON matching this exact schema:",
    JSON.stringify({
      overallScore: "integer 0-20",
      summary: "non-empty string",
      priority: "non-empty string",
      categoryScores: {
        content: "integer 0-5",
        accuracy: "integer 0-5",
        richness: "integer 0-5",
        coherence: "integer 0-5"
      },
      errorPatterns: ["non-empty Chinese labels"],
      suggestions: [
        {
          originalSentence: "non-empty string from the essay",
          suggestedSentence: "non-empty optimized English sentence",
          reason: "non-empty Chinese explanation",
          expressionIntent: "non-empty Chinese label",
          topic: "non-empty topic label",
          preferenceLabel: "non-empty Chinese writing preference label",
          profileExplanation: "optional non-empty Chinese explanation"
        }
      ]
    }),
    "Use the memory to make personalized suggestions. Keep expressions suitable for postgraduate English writing: formal, natural, and not over-complicated.",
    `Essay type: ${request.essayType}`,
    `Prompt: ${request.prompt}`,
    `Essay: ${request.content}`,
    `Memory: ${JSON.stringify(request.memory)}`
  ].join("\n\n");
}

function buildRepairPrompt(invalidOutput: string): string {
  return [
    "Repair this model output into valid JSON matching the required essay review schema.",
    "Return only JSON. Do not include Markdown fences or commentary.",
    invalidOutput
  ].join("\n\n");
}

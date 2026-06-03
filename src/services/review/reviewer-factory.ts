import { describeMissingModelConfig, resolveModelConfig } from "@/services/ai/model-config";
import { DeterministicReviewer, type LlmReviewer } from "@/services/review/llm-reviewer";
import { FetchModelProvider } from "@/services/review/model-provider";
import { ProductionReviewer } from "@/services/review/production-reviewer";

type ReviewerEnv = Record<string, string | undefined>;

export function createReviewerFromEnv(env: ReviewerEnv = process.env): LlmReviewer {
  if (env.REVIEWER_MODE === "deterministic" || (env.NODE_ENV === "test" && !hasModelConfig(env))) {
    return new DeterministicReviewer();
  }

  const config = resolveModelConfig(env);

  if (!config) {
    throw new Error(`Real reviewer requires ${describeMissingModelConfig(env)}`);
  }

  return new ProductionReviewer({
    model: config.model,
    provider: new FetchModelProvider(config)
  });
}

function hasModelConfig(env: ReviewerEnv): boolean {
  return resolveModelConfig(env) !== null;
}

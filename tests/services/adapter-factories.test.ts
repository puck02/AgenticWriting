import { describe, expect, it } from "vitest";

import { MockOcrAdapter, VisionOcrAdapter } from "@/services/ocr/ocr-service";
import { createOcrAdapterFromEnv } from "@/services/ocr/ocr-adapter-factory";
import { DeterministicReviewer } from "@/services/review/llm-reviewer";
import { ProductionReviewer } from "@/services/review/production-reviewer";
import { createReviewerFromEnv } from "@/services/review/reviewer-factory";

describe("adapter factories", () => {
  it("uses production reviewer when model credentials are configured", () => {
    const reviewer = createReviewerFromEnv({
      MODEL_API_BASE_URL: "https://provider.example/v1",
      MODEL_API_KEY: "test-key",
      MODEL_NAME: "test-model"
    });

    expect(reviewer).toBeInstanceOf(ProductionReviewer);
  });

  it("uses deterministic reviewer only when explicitly requested", () => {
    const reviewer = createReviewerFromEnv({
      REVIEWER_MODE: "deterministic",
      MODEL_API_BASE_URL: "https://provider.example/v1",
      MODEL_API_KEY: "test-key",
      MODEL_NAME: "test-model"
    });

    expect(reviewer).toBeInstanceOf(DeterministicReviewer);
  });

  it("uses vision OCR when model credentials are configured", () => {
    const adapter = createOcrAdapterFromEnv({
      MODEL_API_BASE_URL: "https://provider.example/v1",
      MODEL_API_KEY: "test-key",
      MODEL_NAME: "vision-model"
    });

    expect(adapter).toBeInstanceOf(VisionOcrAdapter);
  });

  it("uses mock OCR only in explicit mock mode", () => {
    const adapter = createOcrAdapterFromEnv({
      OCR_MODE: "mock",
      MODEL_API_BASE_URL: "https://provider.example/v1",
      MODEL_API_KEY: "test-key",
      MODEL_NAME: "vision-model"
    });

    expect(adapter).toBeInstanceOf(MockOcrAdapter);
  });
});

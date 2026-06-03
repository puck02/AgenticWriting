import { describe, expect, it, vi } from "vitest";

import { FetchModelProvider } from "@/services/review/model-provider";
import { ProductionReviewer } from "@/services/review/production-reviewer";

const validReviewJson = JSON.stringify({
  overallScore: 16,
  summary: "The essay is clear.",
  priority: "Improve evidence.",
  categoryScores: {
    content: 4,
    accuracy: 4,
    richness: 4,
    coherence: 4
  },
  errorPatterns: ["论据不够具体"],
  suggestions: [
    {
      originalSentence: "Reading is important.",
      suggestedSentence: "Reading plays an important role in personal growth.",
      reason: "The revised sentence is more formal.",
      expressionIntent: "表达观点",
      topic: "reading",
      preferenceLabel: "正式但不过度复杂",
      profileExplanation: "Matches accepted preference."
    }
  ]
});

describe("ProductionReviewer", () => {
  it("returns a parsed structured review from the provider", async () => {
    const provider = {
      completeJson: vi.fn().mockResolvedValue(validReviewJson)
    };
    const reviewer = new ProductionReviewer({ provider, model: "test-model" });

    const review = await reviewer.reviewEssay({
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "Reading",
      content: "Reading is important.",
      memory: { preferences: [], errorPatterns: [], expressions: [] }
    });

    expect(review.overallScore).toBe(16);
    expect(provider.completeJson).toHaveBeenCalledOnce();
  });

  it("attempts one repair when provider output is invalid", async () => {
    const provider = {
      completeJson: vi
        .fn()
        .mockResolvedValueOnce("{\"overallScore\": 16}")
        .mockResolvedValueOnce(validReviewJson)
    };
    const reviewer = new ProductionReviewer({ provider, model: "test-model" });

    const review = await reviewer.reviewEssay({
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "Reading",
      content: "Reading is important.",
      memory: { preferences: [], errorPatterns: [], expressions: [] }
    });

    expect(review.overallScore).toBe(16);
    expect(provider.completeJson).toHaveBeenCalledTimes(2);
  });
});

describe("FetchModelProvider", () => {
  it("uses an OpenAI-compatible base URL for chat completions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: validReviewJson } }]
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new FetchModelProvider({
      baseUrl: "https://provider.example/v1",
      apiKey: "test-key",
      model: "test-model"
    });

    const content = await provider.completeJson("review this essay");

    expect(content).toBe(validReviewJson);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://provider.example/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key"
        })
      })
    );
  });

  it("sends image content to an OpenAI-compatible vision model", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: "Transcribed essay text." } }]
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new FetchModelProvider({
      baseUrl: "https://provider.example/v1",
      apiKey: "test-key",
      model: "vision-model"
    });

    const content = await provider.completeVisionText({
      prompt: "Transcribe this image.",
      file: new File(["fake-image"], "essay.png", { type: "image/png" })
    });
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);

    expect(content).toBe("Transcribed essay text.");
    expect(body.messages[0].content).toEqual([
      { type: "text", text: "Transcribe this image." },
      {
        type: "image_url",
        image_url: {
          url: expect.stringMatching(/^data:image\/png;base64,/)
        }
      }
    ]);
  });

  it("includes provider status and response body when requests fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue("{\"error\":\"model not found\"}")
      })
    );
    const provider = new FetchModelProvider({
      baseUrl: "https://provider.example/v1",
      apiKey: "test-key",
      model: "missing-model"
    });

    await expect(provider.completeJson("review this essay")).rejects.toThrow(
      "Model provider request failed with status 400: {\"error\":\"model not found\"}"
    );
  });

  it("retries transient provider failures", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: vi.fn().mockResolvedValue("{\"error\":\"bad gateway\"}")
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: validReviewJson } }]
        })
      });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new FetchModelProvider({
      baseUrl: "https://provider.example/v1",
      apiKey: "test-key",
      model: "test-model",
      retryDelaysMs: [0]
    });

    const content = await provider.completeJson("review this essay");

    expect(content).toBe(validReviewJson);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-transient provider failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue("{\"error\":\"bad request\"}")
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new FetchModelProvider({
      baseUrl: "https://provider.example/v1",
      apiKey: "test-key",
      model: "test-model",
      retryDelaysMs: [0]
    });

    await expect(provider.completeJson("review this essay")).rejects.toThrow(
      "status 400"
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

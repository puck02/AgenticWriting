import { describe, expect, it, vi } from "vitest";

import type { MemorySnapshot } from "@/domain/memory";
import {
  buildGuidancePrompt,
  generateWritingHint
} from "@/services/guidance/guidance-service";

const memory: MemorySnapshot = {
  preferences: [
    {
      id: "preference-1",
      label: "正式但不过度复杂",
      essayType: "ENGLISH_TWO_CHART",
      acceptCount: 3,
      rejectCount: 0
    }
  ],
  errorPatterns: [],
  expressions: [
    {
      id: "expression-1",
      essayType: "ENGLISH_TWO_CHART",
      topic: "culture",
      expressionIntent: "提出建议",
      optimizedSentence: "This trend deserves more attention from students.",
      reuseCount: 1
    }
  ]
};

describe("guidance-service", () => {
  it("builds a prompt with memory and recent exam references", () => {
    const prompt = buildGuidancePrompt({
      essayType: "ENGLISH_TWO_CHART",
      prompt: "Write about college students' reading habits.",
      draft: "The chart shows that students read more digital books.",
      memory
    });

    expect(prompt).toContain("只补全一句英文");
    expect(prompt).toContain("正式但不过度复杂");
    expect(prompt).toContain("2016-2025");
    expect(prompt).toContain("ENGLISH_TWO_CHART");
  });

  it("returns a parsed one-sentence hint from the provider", async () => {
    const provider = {
      completeJson: vi.fn().mockResolvedValue(
        JSON.stringify({
          completion:
            "This change suggests that reading habits are becoming more flexible.",
          reason: "承接图表趋势，避免空泛评价。",
          expressionFocus: "描述趋势",
          styleNote: "保持用户偏好的稳妥正式表达。",
          referenceLabel: "近十年英语二图表作文"
        })
      )
    };

    const hint = await generateWritingHint({
      provider,
      essayType: "ENGLISH_TWO_CHART",
      prompt: "Write about college students' reading habits.",
      draft: "The chart shows that students read more digital books.",
      memory
    });

    expect(hint.completion).toBe(
      "This change suggests that reading habits are becoming more flexible."
    );
    expect(provider.completeJson).toHaveBeenCalledWith(
      expect.stringContaining("Write about college students' reading habits.")
    );
  });

  it("rejects multi-sentence hints", async () => {
    const provider = {
      completeJson: vi.fn().mockResolvedValue(
        JSON.stringify({
          completion: "This is useful. It also matters.",
          reason: "Too long.",
          expressionFocus: "补充原因",
          styleNote: "Too long.",
          referenceLabel: "test"
        })
      )
    };

    await expect(
      generateWritingHint({
        provider,
        essayType: "ENGLISH_TWO_CHART",
        prompt: "Write about reading.",
        draft: "The chart shows a change.",
        memory
      })
    ).rejects.toThrow();
  });
});

import { describe, expect, it } from "vitest";

import { normalizeOcrText } from "@/services/ocr/text-normalizer";

describe("normalizeOcrText", () => {
  it("removes duplicate blank lines and trims surrounding whitespace", () => {
    expect(normalizeOcrText("  First line\n\n\nSecond line  ")).toBe(
      "First line\n\nSecond line"
    );
  });

  it("normalizes spaces around common English punctuation", () => {
    expect(normalizeOcrText("This is a point , and it matters .")).toBe(
      "This is a point, and it matters."
    );
  });

  it("keeps paragraph breaks while flattening noisy single line breaks", () => {
    expect(
      normalizeOcrText("First sentence\ncontinues here.\n\nSecond paragraph.")
    ).toBe("First sentence continues here.\n\nSecond paragraph.");
  });
});

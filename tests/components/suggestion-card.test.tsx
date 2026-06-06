import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SuggestionCard } from "@/components/SuggestionCard";

describe("SuggestionCard", () => {
  it("keeps feedback button labels on one line", () => {
    render(
      <SuggestionCard
        essayId="essay-1"
        suggestionId="suggestion-1"
        originalSentence="Practice is important."
        suggestedSentence="Practice plays an important role in steady progress."
        reason="表达更正式。"
        accepted={null}
        rejectLabel={null}
      />
    );

    expect(screen.getByRole("button", { name: "采纳" }).className).toContain(
      "whitespace-nowrap"
    );
    expect(screen.getByRole("button", { name: "不采纳" }).className).toContain(
      "whitespace-nowrap"
    );
  });
});

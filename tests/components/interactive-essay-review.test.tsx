import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InteractiveEssayReview } from "@/components/InteractiveEssayReview";

const baseSuggestion = {
  id: "suggestion-1",
  originalSentence: "Practice is important.",
  suggestedSentence: "Practice plays an important role in steady progress.",
  reason: "表达更正式。",
  profileExplanation: "你倾向使用较短句，这里可以保持清楚同时提升正式度。",
  accepted: null,
  rejectLabel: null
};

describe("InteractiveEssayReview", () => {
  it("highlights original sentences that have suggestions", () => {
    render(
      <InteractiveEssayReview
        essayId="essay-1"
        content={"Practice is important.\nStudents should keep trying."}
        suggestions={[baseSuggestion]}
      />
    );

    const highlightedSentence = screen.getByTestId(
      "review-sentence-suggestion-1"
    );

    expect(highlightedSentence.textContent).toBe("Practice is important.");
    expect(highlightedSentence.className).toContain("review-sentence-pending");
    expect(screen.getByText("Students should keep trying.")).toBeTruthy();
  });

  it("replaces the highlighted original sentence after accepting a suggestion", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <InteractiveEssayReview
        essayId="essay-1"
        content={"Practice is important.\nStudents should keep trying."}
        suggestions={[baseSuggestion]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "采纳" }));

    await waitFor(() => {
      expect(screen.getByTestId("review-sentence-suggestion-1").textContent).toBe(
        "Practice plays an important role in steady progress."
      );
    });
    expect(screen.getByTestId("review-sentence-suggestion-1").className).toContain(
      "review-sentence-accepted"
    );
    expect(screen.getByTestId("review-sentence-suggestion-1").className).toContain(
      "review-sentence-fresh"
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/essays/essay-1/feedback",
      expect.objectContaining({
        method: "POST"
      })
    );
  });
});

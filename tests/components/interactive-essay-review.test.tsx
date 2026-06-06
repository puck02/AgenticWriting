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

const acceptedSuggestion = {
  id: "suggestion-2",
  originalSentence: "Students should keep trying.",
  suggestedSentence: "Students should keep practicing steadily.",
  reason: "表达更自然。",
  profileExplanation: null,
  accepted: true,
  rejectLabel: null
};

const rejectedSuggestion = {
  id: "suggestion-3",
  originalSentence: "Teachers can give help.",
  suggestedSentence: "Teachers can provide targeted support.",
  reason: "用词更准确。",
  profileExplanation: null,
  accepted: false,
  rejectLabel: "NOT_MY_STYLE" as const
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

  it("links highlighted sentences with their suggestion cards", () => {
    render(
      <InteractiveEssayReview
        essayId="essay-1"
        content={"Practice is important.\nStudents should keep trying."}
        suggestions={[baseSuggestion]}
      />
    );

    fireEvent.click(screen.getByTestId("review-sentence-suggestion-1"));

    expect(screen.getByTestId("review-sentence-suggestion-1").className).toContain(
      "review-sentence-active"
    );
    expect(screen.getByTestId("review-suggestion-card-suggestion-1").className).toContain(
      "review-suggestion-active"
    );
  });

  it("filters suggestions by feedback status and shows progress counts", () => {
    render(
      <InteractiveEssayReview
        essayId="essay-1"
        content={
          "Practice is important.\nStudents should keep trying.\nTeachers can give help."
        }
        suggestions={[baseSuggestion, acceptedSuggestion, rejectedSuggestion]}
      />
    );

    expect(screen.getByTestId("review-progress-summary").textContent).toContain(
      "待处理 1"
    );
    expect(screen.getByTestId("review-progress-summary").textContent).toContain(
      "已采纳 1"
    );
    expect(screen.getByTestId("review-progress-summary").textContent).toContain(
      "不采纳 1"
    );

    fireEvent.click(screen.getByRole("button", { name: "筛选待处理" }));

    expect(screen.getByTestId("review-suggestion-card-suggestion-1")).toBeTruthy();
    expect(screen.queryByTestId("review-suggestion-card-suggestion-2")).toBeNull();
    expect(screen.queryByTestId("review-suggestion-card-suggestion-3")).toBeNull();
  });

  it("moves active suggestions with arrow keys", () => {
    render(
      <InteractiveEssayReview
        essayId="essay-1"
        content={"Practice is important.\nStudents should keep trying."}
        suggestions={[baseSuggestion, acceptedSuggestion]}
      />
    );

    const workflow = screen.getByTestId("review-workflow");

    fireEvent.keyDown(workflow, { key: "ArrowDown" });
    expect(screen.getByTestId("review-suggestion-card-suggestion-1").className).toContain(
      "review-suggestion-active"
    );

    fireEvent.keyDown(workflow, { key: "ArrowDown" });
    expect(screen.getByTestId("review-suggestion-card-suggestion-2").className).toContain(
      "review-suggestion-active"
    );

    fireEvent.keyDown(workflow, { key: "ArrowUp" });
    expect(screen.getByTestId("review-suggestion-card-suggestion-1").className).toContain(
      "review-suggestion-active"
    );
  });

  it("updates the sentence state after rejecting a suggestion", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "不采纳" }));

    await waitFor(() => {
      expect(screen.getByText("已记录不采纳原因。")).toBeTruthy();
    });
    expect(screen.getByTestId("review-sentence-suggestion-1").className).toContain(
      "review-sentence-rejected"
    );
    expect(screen.getByTestId("review-progress-summary").textContent).toContain(
      "不采纳 1"
    );
  });
});

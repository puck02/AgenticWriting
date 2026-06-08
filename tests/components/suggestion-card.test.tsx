import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("reports saved rejection feedback to the parent workflow", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true
    });
    vi.stubGlobal("fetch", fetchMock);
    const onFeedbackSaved = vi.fn();

    render(
      <SuggestionCard
        essayId="essay-1"
        suggestionId="suggestion-1"
        originalSentence="Practice is important."
        suggestedSentence="Practice plays an important role in steady progress."
        reason="表达更正式。"
        accepted={null}
        rejectLabel={null}
        onFeedbackSaved={onFeedbackSaved}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "不采纳" }));

    await waitFor(() => {
      expect(onFeedbackSaved).toHaveBeenCalledWith("suggestion-1", false);
    });
    expect(screen.getByRole("status").textContent).toContain(
      "已记录不采纳原因。"
    );
  });

  it("copies the suggested expression with inline feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

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

    fireEvent.click(screen.getByRole("button", { name: "复制建议表达" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "Practice plays an important role in steady progress."
      );
    });
    expect(screen.getByRole("status").textContent).toContain("已复制建议表达。");
  });

  it("highlights words that are newly introduced in the suggested sentence", () => {
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

    expect(screen.getByTestId("suggestion-added-token-suggestion-1-plays")).toBeTruthy();
    expect(screen.getByTestId("suggestion-added-token-suggestion-1-progress")).toBeTruthy();
  });

  it("shows coaching prompts that help users learn the revision pattern", () => {
    render(
      <SuggestionCard
        essayId="essay-1"
        suggestionId="suggestion-1"
        originalSentence="Practice is important."
        suggestedSentence="Consistent practice plays an important role in progress."
        reason="用更具体的搭配表达观点。"
        profileExplanation="你更接受稳妥正式表达。"
        accepted={null}
        rejectLabel={null}
      />
    );

    expect(screen.getByText("表达拆解")).toBeTruthy();
    expect(screen.getByText("迁移练习")).toBeTruthy();
    expect(screen.getByText(/把你下一句里的核心名词换进去/)).toBeTruthy();
    expect(screen.getAllByText(/你更接受稳妥正式表达/).length).toBeGreaterThan(0);
  });
});

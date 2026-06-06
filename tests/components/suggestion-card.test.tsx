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
});

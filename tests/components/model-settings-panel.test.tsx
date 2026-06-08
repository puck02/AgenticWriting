import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModelSettingsPanel } from "@/components/ModelSettingsPanel";

describe("ModelSettingsPanel", () => {
  it("saves model settings without showing the full saved api key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        settings: {
          baseUrl: "https://provider.example/v1",
          defaultModel: "gpt-5.5",
          hasApiKey: true,
          maskedApiKey: "sk-a...wxyz"
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ModelSettingsPanel
        initialSettings={{
          baseUrl: "",
          defaultModel: "gpt-5.4-mini",
          hasApiKey: false,
          maskedApiKey: null
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Base URL"), {
      target: { value: "https://provider.example/v1" }
    });
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "sk-abcdefghijklmnopqrstuvwxyz" }
    });
    fireEvent.change(screen.getByLabelText("默认模型"), {
      target: { value: "gpt-5.5" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存模型设置" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/model-settings",
        expect.objectContaining({
          method: "POST"
        })
      );
    });
    expect(screen.getByText("当前密钥：sk-a...wxyz")).toBeTruthy();
    expect(screen.queryByDisplayValue("sk-abcdefghijklmnopqrstuvwxyz")).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";

import {
  getEffectiveModelSettings,
  maskApiKey,
  saveModelSettings
} from "@/services/ai/model-settings-service";

describe("model-settings-service", () => {
  it("uses saved admin settings before environment variables", async () => {
    const db = {
      aiModelSetting: {
        findUnique: vi.fn().mockResolvedValue({
          id: "default",
          baseUrl: "https://admin.example/v1",
          apiKey: "admin-key",
          defaultModel: "gpt-5.5",
          updatedAt: new Date(),
          createdAt: new Date()
        })
      }
    };

    const settings = await getEffectiveModelSettings(db, {
      MODEL_API_BASE_URL: "https://env.example/v1",
      MODEL_API_KEY: "env-key",
      MODEL_NAME: "gpt-5.4-mini"
    });

    expect(settings).toEqual({
      baseUrl: "https://admin.example/v1",
      apiKey: "admin-key",
      defaultModel: "gpt-5.5"
    });
  });

  it("falls back to environment variables and gpt-5.4-mini default model", async () => {
    const db = {
      aiModelSetting: {
        findUnique: vi.fn().mockResolvedValue(null)
      }
    };

    const settings = await getEffectiveModelSettings(db, {
      MODEL_API_BASE_URL: "https://env.example/v1",
      MODEL_API_KEY: "env-key"
    });

    expect(settings).toEqual({
      baseUrl: "https://env.example/v1",
      apiKey: "env-key",
      defaultModel: "gpt-5.4-mini"
    });
  });

  it("does not let MODEL_NAME override the product default review model", async () => {
    const db = {
      aiModelSetting: {
        findUnique: vi.fn().mockResolvedValue(null)
      }
    };

    const settings = await getEffectiveModelSettings(db, {
      MODEL_API_BASE_URL: "https://env.example/v1",
      MODEL_API_KEY: "env-key",
      MODEL_NAME: "gpt-5.5"
    });

    expect(settings?.defaultModel).toBe("gpt-5.4-mini");
  });

  it("updates api key only when a new one is provided", async () => {
    const db = {
      aiModelSetting: {
        findUnique: vi.fn().mockResolvedValue({
          id: "default",
          baseUrl: "https://old.example/v1",
          apiKey: "old-key",
          defaultModel: "gpt-5.4-mini",
          updatedAt: new Date(),
          createdAt: new Date()
        }),
        upsert: vi.fn().mockResolvedValue({})
      }
    };

    await saveModelSettings(db, {
      baseUrl: "https://new.example/v1",
      apiKey: "",
      defaultModel: "gpt-5.5"
    });

    expect(db.aiModelSetting.upsert).toHaveBeenCalledWith({
      where: { id: "default" },
      create: {
        id: "default",
        baseUrl: "https://new.example/v1",
        apiKey: "old-key",
        defaultModel: "gpt-5.5"
      },
      update: {
        baseUrl: "https://new.example/v1",
        apiKey: "old-key",
        defaultModel: "gpt-5.5"
      }
    });
  });

  it("masks api keys without exposing the full value", () => {
    expect(maskApiKey("sk-abcdefghijklmnopqrstuvwxyz")).toBe("sk-a...wxyz");
    expect(maskApiKey("short")).toBe("已设置");
    expect(maskApiKey(null)).toBe(null);
  });
});

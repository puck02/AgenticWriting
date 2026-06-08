import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findModelSetting: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    aiModelSetting: {
      findUnique: mocks.findModelSetting
    },
    writingPreference: {
      findMany: vi.fn().mockResolvedValue([])
    },
    errorPattern: {
      findMany: vi.fn().mockResolvedValue([])
    },
    expressionAsset: {
      findMany: vi.fn().mockResolvedValue([])
    }
  }
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

import { POST } from "@/app/api/guidance/hint/route";

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.getCurrentUser.mockReset();
  mocks.findModelSetting.mockReset();
});

describe("POST /api/guidance/hint", () => {
  it("requires a logged-in user", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null);

    const response = await POST(createHintRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns an explicit error when model settings are missing", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce({ id: "user-1" });
    mocks.findModelSetting.mockResolvedValueOnce(null);

    const response = await POST(createHintRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("模型设置未完成。");
  });
});

function createHintRequest() {
  return {
    json: () =>
      Promise.resolve({
        essayType: "ENGLISH_TWO_CHART",
        prompt: "Write about reading habits.",
        draft: "The chart shows a clear change.",
        reviewModel: "gpt-5.4-mini"
      })
  } as NextRequest;
}

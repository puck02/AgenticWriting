import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    aiModelSetting: {
      findUnique: mocks.findUnique,
      upsert: mocks.upsert
    }
  }
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
  isAdminUser: (user: { role?: string } | null) => user?.role === "ADMIN"
}));

import { GET, POST } from "@/app/api/admin/model-settings/route";

afterEach(() => {
  mocks.getCurrentUser.mockReset();
  mocks.findUnique.mockReset();
  mocks.upsert.mockReset();
});

describe("/api/admin/model-settings", () => {
  it("requires an admin user", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce({ id: "user-1", role: "USER" });

    const response = await GET();

    expect(response.status).toBe(403);
  });

  it("returns public model settings without exposing the full api key", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce({ id: "admin-1", role: "ADMIN" });
    mocks.findUnique.mockResolvedValueOnce({
      id: "default",
      baseUrl: "https://provider.example/v1",
      apiKey: "sk-abcdefghijklmnopqrstuvwxyz",
      defaultModel: "gpt-5.5",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.settings).toEqual({
      baseUrl: "https://provider.example/v1",
      defaultModel: "gpt-5.5",
      hasApiKey: true,
      maskedApiKey: "sk-a...wxyz"
    });
    expect(JSON.stringify(body)).not.toContain("abcdefghijklmnopqrstuvwxyz");
  });

  it("saves admin model settings", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce({ id: "admin-1", role: "ADMIN" });
    mocks.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "default",
      baseUrl: "https://provider.example/v1",
      apiKey: "sk-new-key",
      defaultModel: "gpt-5.4-mini",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    mocks.upsert.mockResolvedValueOnce({});

    const response = await POST(
      createJsonRequest({
        baseUrl: "https://provider.example/v1/",
        apiKey: "sk-new-key",
        defaultModel: "gpt-5.4-mini"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { id: "default" },
      create: {
        id: "default",
        baseUrl: "https://provider.example/v1",
        apiKey: "sk-new-key",
        defaultModel: "gpt-5.4-mini"
      },
      update: {
        baseUrl: "https://provider.example/v1",
        apiKey: "sk-new-key",
        defaultModel: "gpt-5.4-mini"
      }
    });
    expect(body.settings).toEqual(
      expect.objectContaining({
        baseUrl: "https://provider.example/v1",
        hasApiKey: true
      })
    );
    expect(JSON.stringify(body)).not.toContain("sk-new-key");
  });
});

function createJsonRequest(body: unknown) {
  return {
    json: () => Promise.resolve(body)
  } as NextRequest;
}

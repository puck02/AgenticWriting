import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {}
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

import { POST } from "@/app/api/uploads/ocr/route";

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.getCurrentUser.mockReset();
});

describe("POST /api/uploads/ocr", () => {
  it("requires a logged-in user", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null);

    const response = await POST(createUploadRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns a JSON error when real OCR configuration is missing", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce({ id: "user-1" });
    vi.stubEnv("NODE_ENV", "development");

    const response = await POST(createUploadRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Real OCR requires");
  });
});

function createUploadRequest() {
  const formData = new FormData();
  formData.set("purpose", "CONTENT");
  formData.set("file", new File(["fake-image"], "essay.png", { type: "image/png" }));

  return {
    formData: () => Promise.resolve(formData)
  } as NextRequest;
}

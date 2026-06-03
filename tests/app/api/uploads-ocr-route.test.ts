import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getOrCreateCurrentUser: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {}
}));

vi.mock("@/lib/session", () => ({
  getOrCreateCurrentUser: mocks.getOrCreateCurrentUser
}));

import { POST } from "@/app/api/uploads/ocr/route";

describe("POST /api/uploads/ocr", () => {
  it("returns an OCR draft in development when the database is unavailable", async () => {
    mocks.getOrCreateCurrentUser.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const response = await POST(createUploadRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      uploadId: null,
      status: "READY",
      rawText: expect.stringContaining("essay.png"),
      normalizedText: expect.stringContaining("essay.png")
    });
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

import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  uploadAssetCreate: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    uploadAsset: {
      create: mocks.uploadAssetCreate
    }
  }
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

import { POST } from "@/app/api/uploads/ocr/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  mocks.getCurrentUser.mockReset();
  mocks.uploadAssetCreate.mockReset();
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

  it("hides low-level provider parse errors from upload responses", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce({ id: "user-1" });
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MODEL_API_BASE_URL", "https://provider.example/v1");
    vi.stubEnv("MODEL_API_KEY", "test-key");
    vi.stubEnv("OCR_MODEL_NAME", "vision-model");
    mocks.uploadAssetCreate.mockImplementationOnce(({ data }) =>
      Promise.resolve({
        id: "upload-1",
        ...data
      })
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        text: vi.fn().mockResolvedValue("<!doctype html><html></html>")
      })
    );

    const response = await POST(createUploadRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("FAILED");
    expect(body.errorMessage).toContain("Model provider returned non-JSON response");
    expect(body.uploadId).toBe("upload-1");
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

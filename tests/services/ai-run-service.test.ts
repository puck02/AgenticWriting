import { describe, expect, it, vi } from "vitest";

import { createAiRun, finishAiRun } from "@/services/ai/ai-run-service";

describe("ai-run-service", () => {
  it("creates a running AI run", async () => {
    const db = createDb();

    await createAiRun({
      db,
      userId: "user-1",
      agentType: "REVIEW",
      model: "test-model",
      inputSummary: "essay review"
    });

    expect(db.aiRun.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        agentType: "REVIEW",
        model: "test-model",
        inputSummary: "essay review",
        status: "RUNNING"
      }
    });
  });

  it("finishes an AI run with status and latency", async () => {
    const db = createDb();

    await finishAiRun({
      db,
      id: "run-1",
      status: "SUCCEEDED",
      outputSummary: "valid review",
      latencyMs: 1200
    });

    expect(db.aiRun.update).toHaveBeenCalledWith({
      where: { id: "run-1" },
      data: {
        status: "SUCCEEDED",
        outputSummary: "valid review",
        errorMessage: null,
        latencyMs: 1200
      }
    });
  });
});

function createDb() {
  return {
    aiRun: {
      create: vi.fn().mockResolvedValue({ id: "run-1" }),
      update: vi.fn().mockResolvedValue({})
    }
  };
}

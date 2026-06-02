# Agentic Writing Coach Production Upgrade Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first production-grade AI foundations: image OCR drafting, AI run logging, memory events, and a real-model reviewer adapter while keeping the current text review flow stable.

**Architecture:** Keep the app as one Next.js App Router application. Add focused service modules for OCR, AI runs, reviewer providers, and memory events. Preserve the current `POST /api/essays` text contract; image upload creates editable drafts before submission.

**Tech Stack:** Next.js, React, TypeScript, Prisma, PostgreSQL, Zod, Vitest, Tailwind CSS, server route handlers.

---

## File Structure

- Modify `prisma/schema.prisma`: add `UploadAsset`, `AiRun`, `MemoryEvent` and enums.
- Modify `src/domain/memory.ts`: include memory event payload types if needed.
- Create `src/domain/uploads.ts`: upload purpose/status constants and schemas.
- Create `src/services/ocr/text-normalizer.ts`: deterministic OCR text cleanup.
- Create `src/services/ocr/ocr-service.ts`: OCR adapter interface, mock adapter, upload processing workflow.
- Create `src/app/api/uploads/ocr/route.ts`: multipart upload OCR endpoint.
- Modify `src/components/EssaySubmitForm.tsx`: add prompt/body image upload controls and OCR draft insertion.
- Create `src/components/OcrUploadControl.tsx`: focused upload control component.
- Create `src/services/ai/ai-run-service.ts`: create/update AI run records.
- Create `src/services/review/model-provider.ts`: model provider interface and JSON parsing helpers.
- Create `src/services/review/production-reviewer.ts`: production `LlmReviewer` adapter with schema validation and one repair attempt.
- Modify `src/app/api/essays/route.ts`: choose deterministic or production reviewer from environment.
- Modify `src/services/feedback/feedback-service.ts`: create memory events for accept/reject feedback.
- Create `tests/services/ocr-service.test.ts`.
- Create `tests/services/ocr-text-normalizer.test.ts`.
- Create `tests/services/production-reviewer.test.ts`.
- Create `tests/services/ai-run-service.test.ts`.
- Modify `tests/services/feedback-service.test.ts`.
- Modify `README.md` and `.env.example`: document OCR/model env vars and local behavior.

## Task 1: Add Production Data Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add schema models**

Add relations on `User`:

```prisma
  uploadAssets     UploadAsset[]
  aiRuns           AiRun[]
  memoryEvents     MemoryEvent[]
```

Add models and enums after `ExpressionAsset`:

```prisma
model UploadAsset {
  id             String        @id @default(cuid())
  userId         String
  purpose        UploadPurpose
  fileName       String
  mimeType       String
  sizeBytes      Int
  storageKey     String
  ocrStatus      OcrStatus
  rawText        String?
  normalizedText String?
  errorMessage   String?
  createdAt      DateTime      @default(now())
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, purpose, createdAt])
  @@index([userId, ocrStatus])
}

model AiRun {
  id            String      @id @default(cuid())
  userId        String
  agentType     AgentType
  model         String
  status        AiRunStatus
  inputSummary  String
  outputSummary String?
  errorMessage  String?
  latencyMs     Int?
  createdAt     DateTime    @default(now())
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, agentType, createdAt])
  @@index([userId, status])
}

model MemoryEvent {
  id           String          @id @default(cuid())
  userId       String
  eventType    MemoryEventType
  essayId      String?
  suggestionId String?
  essayType    EssayType?
  label        String
  payload      Json
  createdAt    DateTime        @default(now())
  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, eventType, createdAt])
  @@index([userId, essayType, createdAt])
}

enum UploadPurpose {
  PROMPT
  CONTENT
}

enum OcrStatus {
  PENDING
  READY
  FAILED
}

enum AgentType {
  OCR
  REVIEW
  REVIEW_REPAIR
  MEMORY_RETRIEVAL
  MEMORY_UPDATE
}

enum AiRunStatus {
  RUNNING
  SUCCEEDED
  FAILED
}

enum MemoryEventType {
  SUGGESTION_ACCEPTED
  SUGGESTION_REJECTED
  ERROR_PATTERN_OBSERVED
  EXPRESSION_ADDED
  MEMORY_DELETED
  MEMORY_RESTORED
}
```

- [ ] **Step 2: Generate Prisma client**

Run:

```bash
npm run prisma:generate
```

Expected: Prisma client generation succeeds.

- [ ] **Step 3: Verify build types**

Run:

```bash
npm run lint
```

Expected: TypeScript passes.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma package-lock.json package.json
git commit -m "扩展产品级数据模型"
```

## Task 2: Implement OCR Text Normalization

**Files:**
- Create: `src/services/ocr/text-normalizer.ts`
- Create: `tests/services/ocr-text-normalizer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/services/ocr-text-normalizer.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { normalizeOcrText } from "@/services/ocr/text-normalizer";

describe("normalizeOcrText", () => {
  it("removes duplicate blank lines and trims surrounding whitespace", () => {
    expect(normalizeOcrText("  First line\\n\\n\\nSecond line  ")).toBe(
      "First line\\n\\nSecond line"
    );
  });

  it("normalizes spaces around common English punctuation", () => {
    expect(normalizeOcrText("This is a point , and it matters .")).toBe(
      "This is a point, and it matters."
    );
  });

  it("keeps paragraph breaks while flattening noisy single line breaks", () => {
    expect(
      normalizeOcrText("First sentence\\ncontinues here.\\n\\nSecond paragraph.")
    ).toBe("First sentence continues here.\\n\\nSecond paragraph.");
  });
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm test tests/services/ocr-text-normalizer.test.ts
```

Expected: FAIL because `normalizeOcrText` does not exist.

- [ ] **Step 3: Implement normalizer**

Create `src/services/ocr/text-normalizer.ts`:

```ts
export function normalizeOcrText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/([([{])\s+/g, "$1")
        .replace(/\s+([)\]}])/g, "$1")
        .replace(/\s{2,}/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
```

- [ ] **Step 4: Run GREEN**

Run:

```bash
npm test tests/services/ocr-text-normalizer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/ocr/text-normalizer.ts tests/services/ocr-text-normalizer.test.ts
git commit -m "实现 OCR 文本格式整理"
```

## Task 3: Add OCR Service and Upload Domain

**Files:**
- Create: `src/domain/uploads.ts`
- Create: `src/services/ocr/ocr-service.ts`
- Create: `tests/services/ocr-service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/services/ocr-service.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { processOcrUpload } from "@/services/ocr/ocr-service";

const imageFile = new File(["fake-image"], "essay.png", { type: "image/png" });

describe("processOcrUpload", () => {
  it("rejects non-image files", async () => {
    const db = createDb();

    await expect(
      processOcrUpload({
        db,
        userId: "user-1",
        purpose: "CONTENT",
        file: new File(["text"], "essay.txt", { type: "text/plain" }),
        adapter: { recognize: vi.fn() }
      })
    ).rejects.toThrow("Only image uploads are supported");

    expect(db.uploadAsset.create).not.toHaveBeenCalled();
  });

  it("stores OCR-ready upload assets with normalized text", async () => {
    const db = createDb();

    const result = await processOcrUpload({
      db,
      userId: "user-1",
      purpose: "CONTENT",
      file: imageFile,
      adapter: {
        recognize: vi.fn().mockResolvedValue({
          rawText: "This is a sentence .\\n\\nSecond paragraph.",
          confidence: 0.9
        })
      }
    });

    expect(db.uploadAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        purpose: "CONTENT",
        fileName: "essay.png",
        mimeType: "image/png",
        sizeBytes: imageFile.size,
        ocrStatus: "READY",
        rawText: "This is a sentence .\n\nSecond paragraph.",
        normalizedText: "This is a sentence.\n\nSecond paragraph."
      })
    });
    expect(result.normalizedText).toBe("This is a sentence.\n\nSecond paragraph.");
  });
});

function createDb() {
  return {
    uploadAsset: {
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: "upload-1",
          ...data
        })
      )
    }
  };
}
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm test tests/services/ocr-service.test.ts
```

Expected: FAIL because OCR service does not exist.

- [ ] **Step 3: Implement upload domain**

Create `src/domain/uploads.ts`:

```ts
import { z } from "zod";

export const uploadPurposes = ["PROMPT", "CONTENT"] as const;
export const uploadPurposeSchema = z.enum(uploadPurposes);

export type UploadPurposeValue = (typeof uploadPurposes)[number];
```

- [ ] **Step 4: Implement OCR service**

Create `src/services/ocr/ocr-service.ts`:

```ts
import type { Prisma } from "@prisma/client";

import type { UploadPurposeValue } from "@/domain/uploads";
import { normalizeOcrText } from "@/services/ocr/text-normalizer";

const maxUploadBytes = 5 * 1024 * 1024;

export type OcrResult = {
  rawText: string;
  confidence?: number;
};

export type OcrAdapter = {
  recognize(file: File): Promise<OcrResult>;
};

type OcrDb = {
  uploadAsset: {
    create(args: Prisma.UploadAssetCreateArgs): Promise<{
      id: string;
      rawText: string | null;
      normalizedText: string | null;
      ocrStatus: string;
    }>;
  };
};

export class MockOcrAdapter implements OcrAdapter {
  async recognize(file: File): Promise<OcrResult> {
    return {
      rawText: `Mock OCR result for ${file.name}. Replace this text after connecting a production OCR provider.`,
      confidence: 1
    };
  }
}

export async function processOcrUpload({
  db,
  userId,
  purpose,
  file,
  adapter
}: {
  db: OcrDb;
  userId: string;
  purpose: UploadPurposeValue;
  file: File;
  adapter: OcrAdapter;
}) {
  validateImageFile(file);

  const recognized = await adapter.recognize(file);
  const normalizedText = normalizeOcrText(recognized.rawText);
  const upload = await db.uploadAsset.create({
    data: {
      userId,
      purpose,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey: `local://${userId}/${Date.now()}-${file.name}`,
      ocrStatus: "READY",
      rawText: recognized.rawText,
      normalizedText
    }
  });

  return {
    uploadId: upload.id,
    status: upload.ocrStatus,
    rawText: upload.rawText,
    normalizedText: upload.normalizedText
  };
}

function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported");
  }

  if (file.size > maxUploadBytes) {
    throw new Error("Image uploads must be 5MB or smaller");
  }
}
```

- [ ] **Step 5: Run GREEN**

Run:

```bash
npm test tests/services/ocr-service.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/uploads.ts src/services/ocr/ocr-service.ts tests/services/ocr-service.test.ts
git commit -m "实现 OCR 上传服务"
```

## Task 4: Add OCR API Route

**Files:**
- Create: `src/app/api/uploads/ocr/route.ts`
- Modify: `tests/services/ocr-service.test.ts`

- [ ] **Step 1: Add a route-facing validation test**

Append to `tests/services/ocr-service.test.ts`:

```ts
it("rejects oversized image files", async () => {
  const largeFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
    type: "image/png"
  });

  await expect(
    processOcrUpload({
      db: createDb(),
      userId: "user-1",
      purpose: "PROMPT",
      file: largeFile,
      adapter: { recognize: vi.fn() }
    })
  ).rejects.toThrow("Image uploads must be 5MB or smaller");
});
```

- [ ] **Step 2: Run RED or confirm service coverage**

Run:

```bash
npm test tests/services/ocr-service.test.ts
```

Expected: PASS if size validation already exists from Task 3; if not, FAIL and add it before route work.

- [ ] **Step 3: Create OCR route**

Create `src/app/api/uploads/ocr/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { uploadPurposeSchema } from "@/domain/uploads";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";
import { MockOcrAdapter, processOcrUpload } from "@/services/ocr/ocr-service";

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  const parsedPurpose = uploadPurposeSchema.safeParse(formData.get("purpose"));
  const file = formData.get("file");

  if (!parsedPurpose.success || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  const user = await getOrCreateCurrentUser(db);

  try {
    const result = await processOcrUpload({
      db,
      userId: user.id,
      purpose: parsedPurpose.data,
      file,
      adapter: new MockOcrAdapter()
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "OCR failed"
      },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 4: Verify types and build**

Run:

```bash
npm run lint
npm run build
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/uploads/ocr/route.ts tests/services/ocr-service.test.ts
git commit -m "新增 OCR 上传接口"
```

## Task 5: Add OCR Upload Controls to the Essay Form

**Files:**
- Create: `src/components/OcrUploadControl.tsx`
- Modify: `src/components/EssaySubmitForm.tsx`

- [ ] **Step 1: Create focused upload component**

Create `src/components/OcrUploadControl.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";

type OcrPurpose = "PROMPT" | "CONTENT";
type OcrUploadStatus = "idle" | "uploading" | "ready" | "failed";

export function OcrUploadControl({
  purpose,
  label,
  onRecognized
}: {
  purpose: OcrPurpose;
  label: string;
  onRecognized(text: string): void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<OcrUploadStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setStatus("uploading");
    setMessage("正在识别图片文字...");

    try {
      const formData = new FormData();
      formData.set("purpose", purpose);
      formData.set("file", file);

      const response = await fetch("/api/uploads/ocr", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as {
        normalizedText?: string;
        error?: string;
      };

      if (!response.ok || !data.normalizedText) {
        throw new Error(data.error ?? "图片识别失败");
      }

      onRecognized(data.normalizedText);
      setStatus("ready");
      setMessage("识别完成，请核对后再提交。");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "图片识别失败");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className="inline-flex min-h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {status === "uploading" ? "识别中..." : label}
      </button>
      {message ? (
        <p
          className={
            status === "failed"
              ? "text-sm text-red-700"
              : "text-sm text-slate-500"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Wire controls into essay form**

Modify `src/components/EssaySubmitForm.tsx`:

```tsx
import { OcrUploadControl } from "@/components/OcrUploadControl";
```

In the prompt section, render the upload control above the textarea:

```tsx
<div className="mb-3">
  <OcrUploadControl
    purpose="PROMPT"
    label="上传题目图片识别"
    onRecognized={(text) => setPrompt(text)}
  />
</div>
```

In the content section, render:

```tsx
<div className="mb-3">
  <OcrUploadControl
    purpose="CONTENT"
    label="上传正文图片识别"
    onRecognized={(text) => setContent(text)}
  />
</div>
```

- [ ] **Step 3: Verify UI build**

Run:

```bash
npm run lint
npm run build
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/OcrUploadControl.tsx src/components/EssaySubmitForm.tsx
git commit -m "支持图片识别录入作文"
```

## Task 6: Add AI Run Logging Service

**Files:**
- Create: `src/services/ai/ai-run-service.ts`
- Create: `tests/services/ai-run-service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/services/ai-run-service.test.ts`:

```ts
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
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm test tests/services/ai-run-service.test.ts
```

Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement AI run service**

Create `src/services/ai/ai-run-service.ts`:

```ts
import type { AgentType, AiRunStatus, Prisma } from "@prisma/client";

type AiRunDb = {
  aiRun: {
    create(args: Prisma.AiRunCreateArgs): Promise<{ id: string }>;
    update(args: Prisma.AiRunUpdateArgs): Promise<unknown>;
  };
};

export async function createAiRun({
  db,
  userId,
  agentType,
  model,
  inputSummary
}: {
  db: AiRunDb;
  userId: string;
  agentType: AgentType;
  model: string;
  inputSummary: string;
}) {
  return db.aiRun.create({
    data: {
      userId,
      agentType,
      model,
      inputSummary,
      status: "RUNNING"
    }
  });
}

export async function finishAiRun({
  db,
  id,
  status,
  outputSummary,
  errorMessage,
  latencyMs
}: {
  db: AiRunDb;
  id: string;
  status: AiRunStatus;
  outputSummary?: string;
  errorMessage?: string;
  latencyMs: number;
}) {
  return db.aiRun.update({
    where: { id },
    data: {
      status,
      outputSummary,
      errorMessage: errorMessage ?? null,
      latencyMs
    }
  });
}
```

- [ ] **Step 4: Run GREEN**

Run:

```bash
npm test tests/services/ai-run-service.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/ai/ai-run-service.ts tests/services/ai-run-service.test.ts
git commit -m "记录 AI Agent 运行日志"
```

## Task 7: Add Production Reviewer Adapter

**Files:**
- Create: `src/services/review/model-provider.ts`
- Create: `src/services/review/production-reviewer.ts`
- Modify: `src/app/api/essays/route.ts`
- Create: `tests/services/production-reviewer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/services/production-reviewer.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { ProductionReviewer } from "@/services/review/production-reviewer";

const validReviewJson = JSON.stringify({
  overallScore: 16,
  summary: "The essay is clear.",
  priority: "Improve evidence.",
  categoryScores: {
    content: 4,
    accuracy: 4,
    richness: 4,
    coherence: 4
  },
  errorPatterns: ["论据不够具体"],
  suggestions: [
    {
      originalSentence: "Reading is important.",
      suggestedSentence: "Reading plays an important role in personal growth.",
      reason: "The revised sentence is more formal.",
      expressionIntent: "表达观点",
      topic: "reading",
      preferenceLabel: "正式但不过度复杂",
      profileExplanation: "Matches accepted preference."
    }
  ]
});

describe("ProductionReviewer", () => {
  it("returns a parsed structured review from the provider", async () => {
    const provider = {
      completeJson: vi.fn().mockResolvedValue(validReviewJson)
    };
    const reviewer = new ProductionReviewer({ provider, model: "test-model" });

    const review = await reviewer.reviewEssay({
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "Reading",
      content: "Reading is important.",
      memory: { preferences: [], errorPatterns: [], expressions: [] }
    });

    expect(review.overallScore).toBe(16);
    expect(provider.completeJson).toHaveBeenCalledOnce();
  });

  it("attempts one repair when provider output is invalid", async () => {
    const provider = {
      completeJson: vi
        .fn()
        .mockResolvedValueOnce("{\"overallScore\": 16}")
        .mockResolvedValueOnce(validReviewJson)
    };
    const reviewer = new ProductionReviewer({ provider, model: "test-model" });

    const review = await reviewer.reviewEssay({
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "Reading",
      content: "Reading is important.",
      memory: { preferences: [], errorPatterns: [], expressions: [] }
    });

    expect(review.overallScore).toBe(16);
    expect(provider.completeJson).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm test tests/services/production-reviewer.test.ts
```

Expected: FAIL because production reviewer does not exist.

- [ ] **Step 3: Implement model provider interface**

Create `src/services/review/model-provider.ts`:

```ts
export type ModelProvider = {
  completeJson(prompt: string): Promise<string>;
};

export class FetchModelProvider implements ModelProvider {
  constructor({
    endpoint,
    apiKey,
    model
  }: {
    endpoint: string;
    apiKey: string;
    model: string;
  }) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.model = model;
  }

  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly model: string;

  async completeJson(prompt: string): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error("Model provider request failed");
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Model provider returned empty content");
    }

    return content;
  }
}
```

- [ ] **Step 4: Implement production reviewer**

Create `src/services/review/production-reviewer.ts`:

```ts
import { reviewResultSchema, type ReviewResult } from "@/domain/review-schema";
import type { LlmReviewer, ReviewRequest } from "@/services/review/llm-reviewer";
import type { ModelProvider } from "@/services/review/model-provider";

export class ProductionReviewer implements LlmReviewer {
  constructor({
    provider,
    model
  }: {
    provider: ModelProvider;
    model: string;
  }) {
    this.provider = provider;
    this.model = model;
  }

  private readonly provider: ModelProvider;
  private readonly model: string;

  async reviewEssay(request: ReviewRequest): Promise<ReviewResult> {
    const prompt = buildReviewPrompt(request, this.model);
    const firstOutput = await this.provider.completeJson(prompt);
    const firstParsed = parseReview(firstOutput);

    if (firstParsed) {
      return firstParsed;
    }

    const repairedOutput = await this.provider.completeJson(
      buildRepairPrompt(firstOutput)
    );
    const repairedParsed = parseReview(repairedOutput);

    if (!repairedParsed) {
      throw new Error("Model output did not match review schema");
    }

    return repairedParsed;
  }
}

function parseReview(output: string): ReviewResult | null {
  try {
    return reviewResultSchema.parse(JSON.parse(output));
  } catch {
    return null;
  }
}

function buildReviewPrompt(request: ReviewRequest, model: string): string {
  return [
    `You are using model ${model} as an expert coach for Chinese postgraduate English writing.`,
    "Return only valid JSON matching the required review schema.",
    `Essay type: ${request.essayType}`,
    `Prompt: ${request.prompt}`,
    `Essay: ${request.content}`,
    `Memory: ${JSON.stringify(request.memory)}`
  ].join("\n\n");
}

function buildRepairPrompt(invalidOutput: string): string {
  return [
    "Repair this model output into valid JSON matching the required essay review schema.",
    "Return only JSON.",
    invalidOutput
  ].join("\n\n");
}
```

- [ ] **Step 5: Add reviewer factory in route**

Modify `src/app/api/essays/route.ts` to choose reviewer:

```ts
import { FetchModelProvider } from "@/services/review/model-provider";
import { ProductionReviewer } from "@/services/review/production-reviewer";
```

Replace `new DeterministicReviewer()` with `createReviewer()` and add:

```ts
function createReviewer() {
  if (process.env.REVIEWER_MODE !== "production") {
    return new DeterministicReviewer();
  }

  const endpoint = process.env.MODEL_API_ENDPOINT;
  const apiKey = process.env.MODEL_API_KEY;
  const model = process.env.MODEL_NAME;

  if (!endpoint || !apiKey || !model) {
    throw new Error("Production reviewer requires MODEL_API_ENDPOINT, MODEL_API_KEY, and MODEL_NAME");
  }

  return new ProductionReviewer({
    model,
    provider: new FetchModelProvider({ endpoint, apiKey, model })
  });
}
```

- [ ] **Step 6: Run GREEN and full verification**

Run:

```bash
npm test tests/services/production-reviewer.test.ts
npm test
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/services/review/model-provider.ts src/services/review/production-reviewer.ts src/app/api/essays/route.ts tests/services/production-reviewer.test.ts
git commit -m "接入生产级批改模型适配器"
```

## Task 8: Add Memory Events for Feedback

**Files:**
- Modify: `src/services/feedback/feedback-service.ts`
- Modify: `tests/services/feedback-service.test.ts`

- [ ] **Step 1: Write failing test**

Add a `memoryEvent.create` mock in `tests/services/feedback-service.test.ts` and assert accepted feedback creates:

```ts
expect(tx.memoryEvent.create).toHaveBeenCalledWith({
  data: {
    userId: "user-1",
    eventType: "SUGGESTION_ACCEPTED",
    suggestionId: "suggestion-1",
    essayType: "ENGLISH_ONE_PICTURE",
    label: "句式更有判断力",
    payload: expect.objectContaining({
      topic: "reading",
      expressionIntent: "说明阅读价值"
    })
  }
});
```

Add a rejected assertion with `eventType: "SUGGESTION_REJECTED"` and `rejectLabel`.

- [ ] **Step 2: Run RED**

Run:

```bash
npm test tests/services/feedback-service.test.ts
```

Expected: FAIL because memory events are not created.

- [ ] **Step 3: Implement memory event writes**

Extend `FeedbackTransaction`:

```ts
  memoryEvent: {
    create(args: Prisma.MemoryEventCreateArgs): Promise<unknown>;
  };
```

After the state-change guard and before returning, call:

```ts
await tx.memoryEvent.create({
  data: {
    userId,
    eventType: accepted ? "SUGGESTION_ACCEPTED" : "SUGGESTION_REJECTED",
    suggestionId: suggestion.id,
    essayType,
    label: suggestion.preferenceLabel,
    payload: {
      topic: suggestion.topic,
      expressionIntent: suggestion.expressionIntent,
      originalSentence: suggestion.originalSentence,
      suggestedSentence: suggestion.suggestedSentence,
      rejectLabel: accepted ? null : rejectLabel
    }
  }
});
```

- [ ] **Step 4: Run GREEN**

Run:

```bash
npm test tests/services/feedback-service.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/feedback/feedback-service.ts tests/services/feedback-service.test.ts
git commit -m "记录反馈驱动的记忆事件"
```

## Task 9: Documentation and Final Verification

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Update environment example**

Append to `.env.example`:

```env
REVIEWER_MODE="deterministic"
MODEL_API_ENDPOINT=""
MODEL_API_KEY=""
MODEL_NAME=""
```

- [ ] **Step 2: Update README**

Add sections explaining:

```md
## AI 模式

默认使用 deterministic reviewer，便于本地开发和测试。

如需启用生产模型：

```env
REVIEWER_MODE="production"
MODEL_API_ENDPOINT="https://your-provider.example/v1/chat/completions"
MODEL_API_KEY="your-api-key"
MODEL_NAME="your-model-name"
```

图片识别首轮使用 mock OCR adapter，上传图片后会生成可编辑识别草稿。后续可替换为真实 OCR 或多模态模型适配器。
```

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
git status --short
```

Expected:

- Tests pass.
- TypeScript passes.
- Build passes.
- Whitespace check passes.
- Only README and `.env.example` are uncommitted before commit.

- [ ] **Step 4: Commit**

```bash
git add README.md .env.example
git commit -m "补充生产级 AI 配置说明"
```

## Self-Review Notes

- The plan covers image OCR drafting, mock OCR, upload API, production reviewer adapter, AI run logging, and memory event persistence.
- The plan intentionally does not implement real provider-specific OCR in this phase; OCR is behind an adapter so a production provider can be added without changing UI.
- The plan keeps `POST /api/essays` text-only, matching the design requirement that users confirm OCR text before review.
- The plan adds production reviewer infrastructure but defaults local behavior to deterministic mode.
- Future phases should add real OCR provider support, provider-specific model hardening, review versioning, memory event UI, and stronger expression asset uniqueness if needed.

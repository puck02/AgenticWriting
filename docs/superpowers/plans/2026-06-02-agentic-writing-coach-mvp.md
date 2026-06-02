# Agentic Writing Coach MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js full-stack MVP for an Agentic考研英语写作教练 that批改作文, records accept/reject feedback, updates an explainable writing profile, and reuses memory in future review requests.

**Architecture:** Use one Next.js App Router application with server-side service modules. Keep domain logic in pure TypeScript services with Vitest coverage; route handlers and UI call those services. Use Prisma + PostgreSQL for persistent user, essay, review, feedback, memory, and expression data.

**Tech Stack:** Next.js, TypeScript, React, Prisma, PostgreSQL, Zod, Vitest, Tailwind CSS, server route handlers.

---

## File Structure

- Create `package.json`: scripts and dependencies.
- Create `tsconfig.json`: TypeScript configuration.
- Create `next.config.ts`: Next.js configuration.
- Create `vitest.config.ts`: Vitest configuration.
- Create `postcss.config.mjs`, `tailwind.config.ts`: styling configuration.
- Create `src/app/layout.tsx`: root layout.
- Create `src/app/page.tsx`: dashboard and作文提交入口.
- Create `src/app/essays/[id]/page.tsx`: review result and逐句采纳页面.
- Create `src/app/profile/page.tsx`: writing profile page.
- Create `src/app/expressions/page.tsx`: personal expression library page.
- Create `src/app/api/session/route.ts`: lightweight user session route.
- Create `src/app/api/essays/route.ts`: essay creation and review route.
- Create `src/app/api/essays/[id]/feedback/route.ts`: suggestion feedback route.
- Create `src/app/api/profile/route.ts`: profile read route.
- Create `src/app/api/memories/[id]/route.ts`: memory deletion route.
- Create `src/app/api/expressions/[id]/route.ts`: expression deletion route.
- Create `src/lib/db.ts`: Prisma client singleton.
- Create `src/lib/session.ts`: current user lookup and cookie handling.
- Create `src/domain/review-schema.ts`: structured AI review schema.
- Create `src/domain/memory.ts`: memory and feedback domain types.
- Create `src/domain/labels.ts`: essay type, memory type, and reject label constants.
- Create `src/services/review/review-service.ts`: essay review orchestration.
- Create `src/services/review/llm-reviewer.ts`: LLM adapter interface and deterministic development implementation.
- Create `src/services/memory/memory-service.ts`: profile update and retrieval rules.
- Create `src/services/essay/essay-service.ts`: essay persistence workflow.
- Create `src/components/*`: focused UI components.
- Create `prisma/schema.prisma`: database schema.
- Create `tests/domain/review-schema.test.ts`: review schema tests.
- Create `tests/services/memory-service.test.ts`: memory update tests.
- Create `tests/services/review-service.test.ts`: review orchestration tests.
- Create `tests/services/session.test.ts`: user isolation tests.

## Task 1: Scaffold Next.js App and Test Harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create project metadata and dependencies**

Create `package.json`:

```json
{
  "name": "agentic-writing-coach",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "latest",
    "clsx": "latest",
    "next": "latest",
    "prisma": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@testing-library/react": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "autoprefixer": "latest",
    "jsdom": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Add TypeScript and framework config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 3: Add styling config and root shell**

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
```

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#f8fafc",
        accent: "#2563eb"
      }
    }
  },
  plugins: []
};

export default config;
```

Create `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: #f8fafc;
  color: #111827;
}
```

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic Writing Coach",
  description: "AI assisted考研英语写作教练"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: dependencies installed and `package-lock.json` created.

- [ ] **Step 5: Verify scaffold**

Run: `npm test`

Expected: Vitest exits with no test files or zero failed tests.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts postcss.config.mjs tailwind.config.ts src/app/layout.tsx src/app/globals.css
git commit -m "搭建 Next.js 项目脚手架"
```

## Task 2: Add Database Schema and Domain Constants

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `src/domain/labels.ts`
- Create: `src/domain/memory.ts`

- [ ] **Step 1: Define Prisma schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String            @id @default(cuid())
  email            String            @unique
  createdAt        DateTime          @default(now())
  essays           Essay[]
  preferences      WritingPreference[]
  errorPatterns    ErrorPattern[]
  expressionAssets ExpressionAsset[]
}

model Essay {
  id             String             @id @default(cuid())
  userId         String
  type           EssayType
  prompt         String
  content        String
  overallScore   Int?
  reviewSummary  String?
  createdAt      DateTime           @default(now())
  user           User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  suggestions    ReviewSuggestion[]
}

model ReviewSuggestion {
  id                 String              @id @default(cuid())
  essayId            String
  originalSentence   String
  suggestedSentence  String
  reason             String
  preferenceLabel    String
  expressionIntent   String
  topic              String
  profileExplanation String?
  accepted           Boolean?
  rejectLabel        RejectLabel?
  createdAt          DateTime            @default(now())
  essay              Essay               @relation(fields: [essayId], references: [id], onDelete: Cascade)
}

model WritingPreference {
  id           String     @id @default(cuid())
  userId       String
  label        String
  acceptCount  Int        @default(0)
  rejectCount  Int        @default(0)
  essayType    EssayType?
  deletedAt    DateTime?
  updatedAt    DateTime   @updatedAt
  createdAt    DateTime   @default(now())
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ErrorPattern {
  id          String     @id @default(cuid())
  userId      String
  label       String
  count       Int        @default(1)
  essayType   EssayType?
  deletedAt   DateTime?
  updatedAt   DateTime   @updatedAt
  createdAt   DateTime   @default(now())
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ExpressionAsset {
  id                 String     @id @default(cuid())
  userId             String
  essayType          EssayType
  topic              String
  expressionIntent   String
  originalSentence   String
  optimizedSentence  String
  reuseCount         Int        @default(0)
  deletedAt          DateTime?
  createdAt          DateTime   @default(now())
  user               User       @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum EssayType {
  ENGLISH_ONE_PICTURE
  ENGLISH_TWO_CHART
  SMALL_APPLICATION
}

enum RejectLabel {
  TOO_COMPLEX
  NOT_MY_STYLE
  MEANING_CHANGED
  NOT_EXAM_STYLE
  PREFER_ORIGINAL
  UNFAMILIAR_WORDS
}
```

- [ ] **Step 2: Add Prisma client singleton**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

- [ ] **Step 3: Add shared labels**

Create `src/domain/labels.ts`:

```ts
export const essayTypes = [
  { value: "ENGLISH_ONE_PICTURE", label: "英语一大作文：图画作文" },
  { value: "ENGLISH_TWO_CHART", label: "英语二大作文：图表作文" },
  { value: "SMALL_APPLICATION", label: "小作文：应用文" }
] as const;

export const rejectLabels = [
  { value: "TOO_COMPLEX", label: "太复杂" },
  { value: "NOT_MY_STYLE", label: "不像我会写的" },
  { value: "MEANING_CHANGED", label: "意思变了" },
  { value: "NOT_EXAM_STYLE", label: "不符合考研风格" },
  { value: "PREFER_ORIGINAL", label: "我更喜欢原句" },
  { value: "UNFAMILIAR_WORDS", label: "用词不熟悉" }
] as const;

export type EssayTypeValue = (typeof essayTypes)[number]["value"];
export type RejectLabelValue = (typeof rejectLabels)[number]["value"];
```

Create `src/domain/memory.ts`:

```ts
import type { EssayTypeValue, RejectLabelValue } from "./labels";

export type MemorySnapshot = {
  preferences: Array<{
    id: string;
    label: string;
    acceptCount: number;
    rejectCount: number;
    essayType: EssayTypeValue | null;
    deletedAt?: Date | null;
  }>;
  errorPatterns: Array<{
    id: string;
    label: string;
    count: number;
    essayType: EssayTypeValue | null;
    deletedAt?: Date | null;
  }>;
  expressions: Array<{
    id: string;
    essayType: EssayTypeValue;
    topic: string;
    expressionIntent: string;
    optimizedSentence: string;
    reuseCount: number;
    deletedAt?: Date | null;
  }>;
};

export type SuggestionFeedback = {
  userId: string;
  essayType: EssayTypeValue;
  accepted: boolean;
  rejectLabel?: RejectLabelValue;
  preferenceLabel: string;
  originalSentence: string;
  optimizedSentence: string;
  topic: string;
  expressionIntent: string;
};
```

- [ ] **Step 4: Generate Prisma client**

Run: `npm run prisma:generate`

Expected: Prisma client generated without schema errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts src/domain/labels.ts src/domain/memory.ts
git commit -m "定义写作教练数据模型"
```

## Task 3: Implement Memory Update Rules with Tests

**Files:**
- Create: `src/services/memory/memory-service.ts`
- Create: `tests/services/memory-service.test.ts`

- [ ] **Step 1: Write failing memory service tests**

Create `tests/services/memory-service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  applyFeedbackToMemory,
  filterActiveMemory,
  rankMemoryForReview
} from "@/services/memory/memory-service";
import type { MemorySnapshot, SuggestionFeedback } from "@/domain/memory";

const baseFeedback: SuggestionFeedback = {
  userId: "user-1",
  essayType: "ENGLISH_ONE_PICTURE",
  accepted: true,
  preferenceLabel: "正式但不过度复杂",
  originalSentence: "The environment problem is very serious.",
  optimizedSentence: "Environmental issues have become increasingly serious.",
  topic: "环境",
  expressionIntent: "现象描述"
};

describe("memory-service", () => {
  it("adds an accepted suggestion to preference and expression memory", () => {
    const result = applyFeedbackToMemory(emptyMemory(), baseFeedback);

    expect(result.preferences[0]).toMatchObject({
      label: "正式但不过度复杂",
      acceptCount: 1,
      rejectCount: 0,
      essayType: "ENGLISH_ONE_PICTURE"
    });
    expect(result.expressions[0]).toMatchObject({
      optimizedSentence: "Environmental issues have become increasingly serious.",
      topic: "环境",
      expressionIntent: "现象描述"
    });
  });

  it("records a rejected suggestion without adding an expression asset", () => {
    const result = applyFeedbackToMemory(emptyMemory(), {
      ...baseFeedback,
      accepted: false,
      rejectLabel: "TOO_COMPLEX"
    });

    expect(result.preferences[0]).toMatchObject({
      label: "正式但不过度复杂",
      acceptCount: 0,
      rejectCount: 1
    });
    expect(result.expressions).toHaveLength(0);
  });

  it("filters deleted memory before review retrieval", () => {
    const active = filterActiveMemory({
      preferences: [
        { id: "p1", label: "保留", acceptCount: 2, rejectCount: 0, essayType: null },
        { id: "p2", label: "删除", acceptCount: 2, rejectCount: 0, essayType: null, deletedAt: new Date() }
      ],
      errorPatterns: [],
      expressions: []
    });

    expect(active.preferences.map((item) => item.label)).toEqual(["保留"]);
  });

  it("prioritizes same essay type memory", () => {
    const ranked = rankMemoryForReview({
      memory: {
        preferences: [
          { id: "p1", label: "通用", acceptCount: 4, rejectCount: 0, essayType: null },
          { id: "p2", label: "图画作文偏好", acceptCount: 1, rejectCount: 0, essayType: "ENGLISH_ONE_PICTURE" }
        ],
        errorPatterns: [],
        expressions: []
      },
      essayType: "ENGLISH_ONE_PICTURE"
    });

    expect(ranked.preferences[0].label).toBe("图画作文偏好");
  });
});

function emptyMemory(): MemorySnapshot {
  return {
    preferences: [],
    errorPatterns: [],
    expressions: []
  };
}
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/services/memory-service.test.ts`

Expected: fails because `src/services/memory/memory-service.ts` does not exist.

- [ ] **Step 3: Implement pure memory rules**

Create `src/services/memory/memory-service.ts`:

```ts
import type { EssayTypeValue } from "@/domain/labels";
import type { MemorySnapshot, SuggestionFeedback } from "@/domain/memory";

type Deletable<T> = T & { deletedAt?: Date | null };

export function applyFeedbackToMemory(
  memory: MemorySnapshot,
  feedback: SuggestionFeedback
): MemorySnapshot {
  const preferences = upsertPreference(memory, feedback);
  const expressions = feedback.accepted
    ? [
        ...memory.expressions,
        {
          id: `expression-${memory.expressions.length + 1}`,
          essayType: feedback.essayType,
          topic: feedback.topic,
          expressionIntent: feedback.expressionIntent,
          optimizedSentence: feedback.optimizedSentence,
          reuseCount: 0
        }
      ]
    : memory.expressions;

  return {
    ...memory,
    preferences,
    expressions
  };
}

export function filterActiveMemory<T extends MemorySnapshot>(memory: T): MemorySnapshot {
  return {
    preferences: memory.preferences.filter((item) => !("deletedAt" in item) || !item.deletedAt),
    errorPatterns: memory.errorPatterns.filter((item) => !("deletedAt" in item) || !item.deletedAt),
    expressions: memory.expressions.filter((item) => !("deletedAt" in item) || !item.deletedAt)
  };
}

export function rankMemoryForReview({
  memory,
  essayType
}: {
  memory: MemorySnapshot;
  essayType: EssayTypeValue;
}): MemorySnapshot {
  return {
    preferences: [...memory.preferences].sort((a, b) => scorePreference(b, essayType) - scorePreference(a, essayType)),
    errorPatterns: [...memory.errorPatterns].sort((a, b) => scoreEssayType(b.essayType, essayType) - scoreEssayType(a.essayType, essayType)),
    expressions: [...memory.expressions].sort((a, b) => scoreEssayType(b.essayType, essayType) - scoreEssayType(a.essayType, essayType))
  };
}

function upsertPreference(memory: MemorySnapshot, feedback: SuggestionFeedback) {
  const existing = memory.preferences.find(
    (item) => item.label === feedback.preferenceLabel && item.essayType === feedback.essayType
  );

  if (!existing) {
    return [
      ...memory.preferences,
      {
        id: `preference-${memory.preferences.length + 1}`,
        label: feedback.preferenceLabel,
        acceptCount: feedback.accepted ? 1 : 0,
        rejectCount: feedback.accepted ? 0 : 1,
        essayType: feedback.essayType
      }
    ];
  }

  return memory.preferences.map((item) =>
    item.id === existing.id
      ? {
          ...item,
          acceptCount: item.acceptCount + (feedback.accepted ? 1 : 0),
          rejectCount: item.rejectCount + (feedback.accepted ? 0 : 1)
        }
      : item
  );
}

function scorePreference(
  preference: { acceptCount: number; rejectCount: number; essayType: EssayTypeValue | null },
  essayType: EssayTypeValue
) {
  return scoreEssayType(preference.essayType, essayType) + preference.acceptCount - preference.rejectCount;
}

function scoreEssayType(itemEssayType: EssayTypeValue | null, targetEssayType: EssayTypeValue) {
  if (itemEssayType === targetEssayType) return 100;
  if (itemEssayType === null) return 10;
  return 0;
}
```

- [ ] **Step 4: Run memory tests**

Run: `npm test -- tests/services/memory-service.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/memory/memory-service.ts tests/services/memory-service.test.ts
git commit -m "实现用户写作画像更新规则"
```

## Task 4: Define Structured Review Schema and LLM Adapter

**Files:**
- Create: `src/domain/review-schema.ts`
- Create: `src/services/review/llm-reviewer.ts`
- Create: `tests/domain/review-schema.test.ts`

- [ ] **Step 1: Write failing schema tests**

Create `tests/domain/review-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { reviewResultSchema } from "@/domain/review-schema";

describe("reviewResultSchema", () => {
  it("accepts a complete structured review result", () => {
    const parsed = reviewResultSchema.parse({
      overallScore: 14,
      summary: "结构完整，但表达有中式搭配。",
      priority: "先处理中式搭配，再补强段落连接。",
      categoryScores: {
        content: 4,
        accuracy: 3,
        richness: 3,
        coherence: 4
      },
      errorPatterns: ["中式英语搭配"],
      suggestions: [
        {
          originalSentence: "The environment problem is very serious.",
          suggestedSentence: "Environmental issues have become increasingly serious.",
          reason: "搭配更自然，语气正式。",
          expressionIntent: "现象描述",
          topic: "环境",
          preferenceLabel: "正式但不过度复杂",
          profileExplanation: "根据你过去偏好的正式简洁风格推荐。"
        }
      ]
    });

    expect(parsed.overallScore).toBe(14);
  });

  it("rejects scores outside the exam score range", () => {
    expect(() =>
      reviewResultSchema.parse({
        overallScore: 30,
        summary: "分数越界。",
        priority: "重新评分。",
        categoryScores: {
          content: 4,
          accuracy: 3,
          richness: 3,
          coherence: 4
        },
        errorPatterns: [],
        suggestions: []
      })
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/domain/review-schema.test.ts`

Expected: fails because `review-schema.ts` does not exist.

- [ ] **Step 3: Implement review schema**

Create `src/domain/review-schema.ts`:

```ts
import { z } from "zod";

export const reviewSuggestionSchema = z.object({
  originalSentence: z.string().min(1),
  suggestedSentence: z.string().min(1),
  reason: z.string().min(1),
  expressionIntent: z.string().min(1),
  topic: z.string().min(1),
  preferenceLabel: z.string().min(1),
  profileExplanation: z.string().min(1).optional()
});

export const reviewResultSchema = z.object({
  overallScore: z.number().int().min(0).max(20),
  summary: z.string().min(1),
  priority: z.string().min(1),
  categoryScores: z.object({
    content: z.number().int().min(0).max(5),
    accuracy: z.number().int().min(0).max(5),
    richness: z.number().int().min(0).max(5),
    coherence: z.number().int().min(0).max(5)
  }),
  errorPatterns: z.array(z.string().min(1)),
  suggestions: z.array(reviewSuggestionSchema)
});

export type ReviewResult = z.infer<typeof reviewResultSchema>;
export type ReviewSuggestion = z.infer<typeof reviewSuggestionSchema>;
```

- [ ] **Step 4: Add LLM reviewer interface and deterministic implementation**

Create `src/services/review/llm-reviewer.ts`:

```ts
import type { EssayTypeValue } from "@/domain/labels";
import type { MemorySnapshot } from "@/domain/memory";
import type { ReviewResult } from "@/domain/review-schema";

export type ReviewRequest = {
  essayType: EssayTypeValue;
  prompt: string;
  content: string;
  memory: MemorySnapshot;
};

export interface LlmReviewer {
  reviewEssay(request: ReviewRequest): Promise<ReviewResult>;
}

export class DeterministicReviewer implements LlmReviewer {
  async reviewEssay(request: ReviewRequest): Promise<ReviewResult> {
    const preferredStyle = request.memory.preferences[0]?.label ?? "正式但不过度复杂";
    return {
      overallScore: 14,
      summary: "结构完整，但部分表达不够自然，论证可以更具体。",
      priority: "先处理中式搭配，再补强段落间逻辑连接。",
      categoryScores: {
        content: 4,
        accuracy: 3,
        richness: 3,
        coherence: 4
      },
      errorPatterns: ["中式英语搭配", "论证过泛"],
      suggestions: [
        {
          originalSentence: firstSentence(request.content),
          suggestedSentence: "Environmental issues have become increasingly serious.",
          reason: "搭配更自然，适合考研作文中的现象描述。",
          expressionIntent: "现象描述",
          topic: inferTopic(request.prompt),
          preferenceLabel: preferredStyle,
          profileExplanation: `根据你过去偏好的${preferredStyle}风格推荐。`
        }
      ]
    };
  }
}

function firstSentence(content: string) {
  return content.split(/[.!?。！？]/).find((part) => part.trim().length > 0)?.trim() ?? content.trim();
}

function inferTopic(prompt: string) {
  if (prompt.includes("环境")) return "环境";
  if (prompt.includes("教育")) return "教育";
  return "通用话题";
}
```

- [ ] **Step 5: Run schema tests**

Run: `npm test -- tests/domain/review-schema.test.ts`

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/domain/review-schema.ts src/services/review/llm-reviewer.ts tests/domain/review-schema.test.ts
git commit -m "定义结构化作文批改结果"
```

## Task 5: Implement Essay Review Orchestration

**Files:**
- Create: `src/services/review/review-service.ts`
- Create: `src/services/essay/essay-service.ts`
- Create: `tests/services/review-service.test.ts`

- [ ] **Step 1: Write failing orchestration tests**

Create `tests/services/review-service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { reviewEssayDraft } from "@/services/review/review-service";
import type { LlmReviewer } from "@/services/review/llm-reviewer";

describe("reviewEssayDraft", () => {
  it("injects ranked memory into the reviewer", async () => {
    let seenMemoryLabel = "";
    const reviewer: LlmReviewer = {
      async reviewEssay(request) {
        seenMemoryLabel = request.memory.preferences[0]?.label ?? "";
        return {
          overallScore: 13,
          summary: "需要提升表达。",
          priority: "先优化表达。",
          categoryScores: { content: 3, accuracy: 3, richness: 3, coherence: 4 },
          errorPatterns: ["表达重复"],
          suggestions: [
            {
              originalSentence: "This is important.",
              suggestedSentence: "This issue deserves careful attention.",
              reason: "表达更正式。",
              expressionIntent: "表达观点",
              topic: "通用话题",
              preferenceLabel: "正式但不过度复杂"
            }
          ]
        };
      }
    };

    const result = await reviewEssayDraft({
      reviewer,
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "环境话题",
      content: "This is important.",
      memory: {
        preferences: [
          { id: "p1", label: "通用", acceptCount: 8, rejectCount: 0, essayType: null },
          { id: "p2", label: "图画作文偏好", acceptCount: 1, rejectCount: 0, essayType: "ENGLISH_ONE_PICTURE" }
        ],
        errorPatterns: [],
        expressions: []
      }
    });

    expect(seenMemoryLabel).toBe("图画作文偏好");
    expect(result.suggestions).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/services/review-service.test.ts`

Expected: fails because `review-service.ts` does not exist.

- [ ] **Step 3: Implement review orchestration**

Create `src/services/review/review-service.ts`:

```ts
import type { EssayTypeValue } from "@/domain/labels";
import type { MemorySnapshot } from "@/domain/memory";
import { reviewResultSchema, type ReviewResult } from "@/domain/review-schema";
import { rankMemoryForReview } from "@/services/memory/memory-service";
import type { LlmReviewer } from "./llm-reviewer";

export async function reviewEssayDraft({
  reviewer,
  essayType,
  prompt,
  content,
  memory
}: {
  reviewer: LlmReviewer;
  essayType: EssayTypeValue;
  prompt: string;
  content: string;
  memory: MemorySnapshot;
}): Promise<ReviewResult> {
  const rankedMemory = rankMemoryForReview({ memory, essayType });
  const rawResult = await reviewer.reviewEssay({
    essayType,
    prompt,
    content,
    memory: rankedMemory
  });

  return reviewResultSchema.parse(rawResult);
}
```

Create `src/services/essay/essay-service.ts`:

```ts
import type { PrismaClient } from "@prisma/client";
import type { EssayTypeValue } from "@/domain/labels";
import type { ReviewResult } from "@/domain/review-schema";

export async function saveReviewedEssay({
  db,
  userId,
  essayType,
  prompt,
  content,
  review
}: {
  db: PrismaClient;
  userId: string;
  essayType: EssayTypeValue;
  prompt: string;
  content: string;
  review: ReviewResult;
}) {
  const essay = await db.essay.create({
    data: {
      userId,
      type: essayType,
      prompt,
      content,
      overallScore: review.overallScore,
      reviewSummary: review.summary,
      suggestions: {
        create: review.suggestions.map((suggestion) => ({
          originalSentence: suggestion.originalSentence,
          suggestedSentence: suggestion.suggestedSentence,
          reason: suggestion.reason,
          preferenceLabel: suggestion.preferenceLabel,
          expressionIntent: suggestion.expressionIntent,
          topic: suggestion.topic,
          profileExplanation: suggestion.profileExplanation
        }))
      }
    },
    include: {
      suggestions: true
    }
  });

  await Promise.all(
    review.errorPatterns.map((label) =>
      db.errorPattern.upsert({
        where: {
          id: `${userId}:${essayType}:${label}`
        },
        update: {
          count: { increment: 1 }
        },
        create: {
          id: `${userId}:${essayType}:${label}`,
          userId,
          essayType,
          label,
          count: 1
        }
      })
    )
  );

  return essay;
}
```

- [ ] **Step 4: Run orchestration tests**

Run: `npm test -- tests/services/review-service.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/review/review-service.ts src/services/essay/essay-service.ts tests/services/review-service.test.ts
git commit -m "实现作文批改编排服务"
```

## Task 6: Add Session and API Routes

**Files:**
- Create: `src/lib/session.ts`
- Create: `src/app/api/session/route.ts`
- Create: `src/app/api/essays/route.ts`
- Create: `src/app/api/essays/[id]/feedback/route.ts`
- Create: `src/app/api/profile/route.ts`
- Create: `src/app/api/memories/[id]/route.ts`
- Create: `src/app/api/expressions/[id]/route.ts`
- Create: `tests/services/session.test.ts`

- [ ] **Step 1: Write session isolation tests**

Create `tests/services/session.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canAccessUserResource } from "@/lib/session";

describe("canAccessUserResource", () => {
  it("allows a user to access their own resource", () => {
    expect(canAccessUserResource({ currentUserId: "u1", resourceUserId: "u1" })).toBe(true);
  });

  it("blocks a user from accessing another user's resource", () => {
    expect(canAccessUserResource({ currentUserId: "u1", resourceUserId: "u2" })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/services/session.test.ts`

Expected: fails because `src/lib/session.ts` does not exist.

- [ ] **Step 3: Implement session helpers**

Create `src/lib/session.ts`:

```ts
import { cookies } from "next/headers";
import type { PrismaClient, User } from "@prisma/client";

const cookieName = "agentic_writing_user";

export function canAccessUserResource({
  currentUserId,
  resourceUserId
}: {
  currentUserId: string;
  resourceUserId: string;
}) {
  return currentUserId === resourceUserId;
}

export async function getOrCreateCurrentUser(db: PrismaClient): Promise<User> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(cookieName)?.value;

  if (userId) {
    const existing = await db.user.findUnique({ where: { id: userId } });
    if (existing) return existing;
  }

  const user = await db.user.create({
    data: {
      email: `demo-${crypto.randomUUID()}@local`
    }
  });

  cookieStore.set(cookieName, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  return user;
}
```

- [ ] **Step 4: Implement route handlers**

Create `src/app/api/session/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getOrCreateCurrentUser(db);
  return NextResponse.json({ userId: user.id });
}
```

Create `src/app/api/essays/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { essayTypes, type EssayTypeValue } from "@/domain/labels";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";
import { DeterministicReviewer } from "@/services/review/llm-reviewer";
import { reviewEssayDraft } from "@/services/review/review-service";
import { saveReviewedEssay } from "@/services/essay/essay-service";

const requestSchema = z.object({
  essayType: z.enum(essayTypes.map((item) => item.value) as [string, ...string[]]),
  prompt: z.string().min(1),
  content: z.string().min(1)
});

export async function POST(request: Request) {
  const user = await getOrCreateCurrentUser(db);
  const body = requestSchema.parse(await request.json());
  const essayType = body.essayType as EssayTypeValue;
  const memory = await loadMemory(user.id);
  const review = await reviewEssayDraft({
    reviewer: new DeterministicReviewer(),
    essayType,
    prompt: body.prompt,
    content: body.content,
    memory
  });
  const essay = await saveReviewedEssay({
    db,
    userId: user.id,
    essayType,
    prompt: body.prompt,
    content: body.content,
    review
  });

  return NextResponse.json({ essayId: essay.id });
}

async function loadMemory(userId: string) {
  const [preferences, errorPatterns, expressions] = await Promise.all([
    db.writingPreference.findMany({ where: { userId, deletedAt: null } }),
    db.errorPattern.findMany({ where: { userId, deletedAt: null } }),
    db.expressionAsset.findMany({ where: { userId, deletedAt: null } })
  ]);

  return {
    preferences,
    errorPatterns,
    expressions: expressions.map((item) => ({
      id: item.id,
      essayType: item.essayType,
      topic: item.topic,
      expressionIntent: item.expressionIntent,
      optimizedSentence: item.optimizedSentence,
      reuseCount: item.reuseCount
    }))
  };
}
```

Create `src/app/api/essays/[id]/feedback/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import type { RejectLabel } from "@prisma/client";
import { rejectLabels } from "@/domain/labels";
import { db } from "@/lib/db";
import { canAccessUserResource, getOrCreateCurrentUser } from "@/lib/session";

const requestSchema = z.object({
  suggestionId: z.string().min(1),
  accepted: z.boolean(),
  rejectLabel: z.enum(rejectLabels.map((item) => item.value) as [string, ...string[]]).optional()
}).refine((value) => value.accepted || Boolean(value.rejectLabel), {
  message: "不采纳建议时必须选择原因标签",
  path: ["rejectLabel"]
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateCurrentUser(db);
  const { id } = await params;
  const body = requestSchema.parse(await request.json());
  const essay = await db.essay.findUnique({ where: { id } });

  if (!essay || !canAccessUserResource({ currentUserId: user.id, resourceUserId: essay.userId })) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const suggestion = await db.reviewSuggestion.update({
    where: { id: body.suggestionId },
    data: {
      accepted: body.accepted,
      rejectLabel: body.accepted ? null : (body.rejectLabel as RejectLabel)
    }
  });

  if (body.accepted) {
    await db.expressionAsset.create({
      data: {
        userId: user.id,
        essayType: essay.type,
        topic: suggestion.topic,
        expressionIntent: suggestion.expressionIntent,
        originalSentence: suggestion.originalSentence,
        optimizedSentence: suggestion.suggestedSentence
      }
    });
  }

  return NextResponse.json({ ok: true });
}
```

Create `src/app/api/profile/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getOrCreateCurrentUser(db);
  const [preferences, errorPatterns] = await Promise.all([
    db.writingPreference.findMany({ where: { userId: user.id, deletedAt: null }, orderBy: { updatedAt: "desc" } }),
    db.errorPattern.findMany({ where: { userId: user.id, deletedAt: null }, orderBy: { updatedAt: "desc" } })
  ]);

  return NextResponse.json({ preferences, errorPatterns });
}
```

Create `src/app/api/memories/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateCurrentUser(db);
  const { id } = await params;

  await db.writingPreference.updateMany({
    where: { id, userId: user.id },
    data: { deletedAt: new Date() }
  });
  await db.errorPattern.updateMany({
    where: { id, userId: user.id },
    data: { deletedAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}
```

Create `src/app/api/expressions/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateCurrentUser(db);
  const { id } = await params;

  await db.expressionAsset.updateMany({
    where: { id, userId: user.id },
    data: { deletedAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Run session tests**

Run: `npm test -- tests/services/session.test.ts`

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/session.ts src/app/api/session/route.ts src/app/api/essays/route.ts src/app/api/essays/[id]/feedback/route.ts src/app/api/profile/route.ts src/app/api/memories/[id]/route.ts src/app/api/expressions/[id]/route.ts tests/services/session.test.ts
git commit -m "实现作文批改接口"
```

## Task 7: Build MVP Pages

**Files:**
- Create: `src/components/AppNav.tsx`
- Create: `src/components/EssaySubmitForm.tsx`
- Create: `src/components/SuggestionCard.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/essays/[id]/page.tsx`
- Create: `src/app/profile/page.tsx`
- Create: `src/app/expressions/page.tsx`

- [ ] **Step 1: Create navigation component**

Create `src/components/AppNav.tsx`:

```tsx
import Link from "next/link";

export function AppNav() {
  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <Link href="/" className="font-semibold text-ink">
        Agentic Writing Coach
      </Link>
      <div className="flex gap-4 text-sm text-slate-600">
        <Link href="/">新建批改</Link>
        <Link href="/profile">我的写作画像</Link>
        <Link href="/expressions">个人表达库</Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create submit form**

Create `src/components/EssaySubmitForm.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { essayTypes } from "@/domain/labels";

export function EssaySubmitForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    const response = await fetch("/api/essays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        essayType: formData.get("essayType"),
        prompt: formData.get("prompt"),
        content: formData.get("content")
      })
    });
    const data = await response.json();
    setPending(false);
    router.push(`/essays/${data.essayId}`);
  }

  return (
    <form action={submit} className="grid gap-4 rounded border border-slate-200 bg-white p-6">
      <label className="grid gap-2">
        <span className="text-sm font-medium">题型</span>
        <select name="essayType" className="rounded border border-slate-300 px-3 py-2">
          {essayTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">题目</span>
        <textarea name="prompt" rows={4} className="rounded border border-slate-300 px-3 py-2" required />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">作文正文</span>
        <textarea name="content" rows={12} className="rounded border border-slate-300 px-3 py-2" required />
      </label>
      <button disabled={pending} className="rounded bg-accent px-4 py-2 font-medium text-white disabled:opacity-60">
        {pending ? "批改中" : "开始批改"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create landing page**

Create `src/app/page.tsx`:

```tsx
import { AppNav } from "@/components/AppNav";
import { EssaySubmitForm } from "@/components/EssaySubmitForm";

export default function HomePage() {
  return (
    <main>
      <AppNav />
      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-8">
        <div>
          <h1 className="text-3xl font-semibold">新建作文批改</h1>
          <p className="mt-2 text-slate-600">提交作文后，系统会给出总评诊断、逐句建议，并更新你的个人写作画像。</p>
        </div>
        <EssaySubmitForm />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Create suggestion card and review page**

Create `src/components/SuggestionCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { rejectLabels } from "@/domain/labels";

export function SuggestionCard({
  essayId,
  suggestion
}: {
  essayId: string;
  suggestion: {
    id: string;
    originalSentence: string;
    suggestedSentence: string;
    reason: string;
    profileExplanation: string | null;
  };
}) {
  const [status, setStatus] = useState<string | null>(null);

  async function sendFeedback(accepted: boolean, rejectLabel?: string) {
    await fetch(`/api/essays/${essayId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId: suggestion.id, accepted, rejectLabel })
    });
    setStatus(accepted ? "已采纳，并加入表达库" : "已记录不采纳原因");
  }

  return (
    <article className="grid gap-3 rounded border border-slate-200 bg-white p-4">
      <div>
        <p className="text-xs font-medium text-slate-500">原句</p>
        <p>{suggestion.originalSentence}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">建议表达</p>
        <p>{suggestion.suggestedSentence}</p>
      </div>
      <p className="text-sm text-slate-600">{suggestion.reason}</p>
      {suggestion.profileExplanation ? <p className="text-sm text-blue-700">{suggestion.profileExplanation}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => sendFeedback(true)} className="rounded bg-accent px-3 py-2 text-sm font-medium text-white">
          采纳
        </button>
        {rejectLabels.map((item) => (
          <button
            key={item.value}
            onClick={() => sendFeedback(false, item.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {item.label}
          </button>
        ))}
      </div>
      {status ? <p className="text-sm text-slate-500">{status}</p> : null}
    </article>
  );
}
```

Create `src/app/essays/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { SuggestionCard } from "@/components/SuggestionCard";
import { db } from "@/lib/db";
import { canAccessUserResource, getOrCreateCurrentUser } from "@/lib/session";

export default async function EssayReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateCurrentUser(db);
  const { id } = await params;
  const essay = await db.essay.findUnique({
    where: { id },
    include: { suggestions: true }
  });

  if (!essay || !canAccessUserResource({ currentUserId: user.id, resourceUserId: essay.userId })) {
    notFound();
  }

  return (
    <main>
      <AppNav />
      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-8">
        <div className="rounded border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">预估得分</p>
          <h1 className="text-3xl font-semibold">{essay.overallScore ?? 0} / 20</h1>
          <p className="mt-3 text-slate-700">{essay.reviewSummary}</p>
        </div>
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">逐句优化</h2>
          {essay.suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} essayId={essay.id} suggestion={suggestion} />
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Create profile and expression pages**

Create `src/app/profile/page.tsx`:

```tsx
import { AppNav } from "@/components/AppNav";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await getOrCreateCurrentUser(db);
  const [preferences, errorPatterns] = await Promise.all([
    db.writingPreference.findMany({ where: { userId: user.id, deletedAt: null }, orderBy: { updatedAt: "desc" } }),
    db.errorPattern.findMany({ where: { userId: user.id, deletedAt: null }, orderBy: { updatedAt: "desc" } })
  ]);

  return (
    <main>
      <AppNav />
      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-8">
        <h1 className="text-3xl font-semibold">我的写作画像</h1>
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">表达偏好</h2>
          {preferences.map((item) => (
            <div key={item.id} className="rounded border border-slate-200 bg-white p-4">
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-slate-500">采纳 {item.acceptCount} 次 · 拒绝 {item.rejectCount} 次</p>
            </div>
          ))}
        </section>
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">常见错误模式</h2>
          {errorPatterns.map((item) => (
            <div key={item.id} className="rounded border border-slate-200 bg-white p-4">
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-slate-500">累计出现 {item.count} 次</p>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
```

Create `src/app/expressions/page.tsx`:

```tsx
import { AppNav } from "@/components/AppNav";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";

export default async function ExpressionsPage() {
  const user = await getOrCreateCurrentUser(db);
  const expressions = await db.expressionAsset.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main>
      <AppNav />
      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-8">
        <h1 className="text-3xl font-semibold">个人表达库</h1>
        <div className="grid gap-3">
          {expressions.map((item) => (
            <article key={item.id} className="rounded border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">{item.topic} · {item.expressionIntent}</p>
              <p className="mt-2 font-medium">{item.optimizedSentence}</p>
              <p className="mt-1 text-sm text-slate-500">已复用 {item.reuseCount} 次</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Build the app**

Run: `npm run build`

Expected: Next.js build completes without TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/AppNav.tsx src/components/EssaySubmitForm.tsx src/components/SuggestionCard.tsx src/app/page.tsx src/app/essays/[id]/page.tsx src/app/profile/page.tsx src/app/expressions/page.tsx
git commit -m "实现写作教练核心页面"
```

## Task 8: Wire Profile Updates for Feedback

**Files:**
- Modify: `src/app/api/essays/[id]/feedback/route.ts`
- Create: `src/services/memory/persistence.ts`
- Modify: `tests/services/memory-service.test.ts`

- [ ] **Step 1: Add persistence helper**

Create `src/services/memory/persistence.ts`:

```ts
import type { PrismaClient, EssayType, RejectLabel } from "@prisma/client";

export async function recordSuggestionFeedback({
  db,
  userId,
  essayType,
  suggestionId,
  accepted,
  rejectLabel
}: {
  db: PrismaClient;
  userId: string;
  essayType: EssayType;
  suggestionId: string;
  accepted: boolean;
  rejectLabel?: RejectLabel;
}) {
  const suggestion = await db.reviewSuggestion.update({
    where: { id: suggestionId },
    data: {
      accepted,
      rejectLabel: accepted ? null : rejectLabel
    }
  });

  await db.writingPreference.upsert({
    where: {
      id: `${userId}:${essayType}:${suggestion.preferenceLabel}`
    },
    update: {
      acceptCount: { increment: accepted ? 1 : 0 },
      rejectCount: { increment: accepted ? 0 : 1 }
    },
    create: {
      id: `${userId}:${essayType}:${suggestion.preferenceLabel}`,
      userId,
      essayType,
      label: suggestion.preferenceLabel,
      acceptCount: accepted ? 1 : 0,
      rejectCount: accepted ? 0 : 1
    }
  });

  if (accepted) {
    await db.expressionAsset.create({
      data: {
        userId,
        essayType,
        topic: suggestion.topic,
        expressionIntent: suggestion.expressionIntent,
        originalSentence: suggestion.originalSentence,
        optimizedSentence: suggestion.suggestedSentence
      }
    });
  }

  return suggestion;
}
```

- [ ] **Step 2: Replace inline feedback update route logic**

Modify `src/app/api/essays/[id]/feedback/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import type { RejectLabel } from "@prisma/client";
import { rejectLabels } from "@/domain/labels";
import { db } from "@/lib/db";
import { canAccessUserResource, getOrCreateCurrentUser } from "@/lib/session";
import { recordSuggestionFeedback } from "@/services/memory/persistence";

const requestSchema = z.object({
  suggestionId: z.string().min(1),
  accepted: z.boolean(),
  rejectLabel: z.enum(rejectLabels.map((item) => item.value) as [string, ...string[]]).optional()
}).refine((value) => value.accepted || Boolean(value.rejectLabel), {
  message: "不采纳建议时必须选择原因标签",
  path: ["rejectLabel"]
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateCurrentUser(db);
  const { id } = await params;
  const body = requestSchema.parse(await request.json());
  const essay = await db.essay.findUnique({ where: { id } });

  if (!essay || !canAccessUserResource({ currentUserId: user.id, resourceUserId: essay.userId })) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await recordSuggestionFeedback({
    db,
    userId: user.id,
    essayType: essay.type,
    suggestionId: body.suggestionId,
    accepted: body.accepted,
    rejectLabel: body.rejectLabel as RejectLabel | undefined
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Run tests and build**

Run: `npm test`

Expected: all tests pass.

Run: `npm run build`

Expected: Next.js build completes.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/essays/[id]/feedback/route.ts src/services/memory/persistence.ts tests/services/memory-service.test.ts
git commit -m "连接反馈与写作画像更新"
```

## Task 9: Final Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add local run instructions**

Create `README.md`:

````md
# Agentic Writing Coach

AI 辅助考研英语写作教练 MVP。

## 本地运行

1. 安装依赖：

```bash
npm install
```

2. 配置数据库：

```bash
cp .env.example .env
```

3. 运行迁移：

```bash
npm run prisma:migrate
```

4. 启动开发服务器：

```bash
npm run dev
```

## 验证

```bash
npm test
npm run build
```
````

Create `.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agentic_writing"
```

- [ ] **Step 2: Run complete verification**

Run: `npm test`

Expected: all tests pass.

Run: `npm run build`

Expected: production build completes.

Run: `git status --short`

Expected: only `README.md` and `.env.example` are uncommitted.

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "补充项目运行说明"
```

## Self-Review Notes

- Spec coverage: the plan covers essay submission, structured review, accept/reject feedback, fixed reject labels, explainable profile memory, expression library, user isolation, deletion endpoints, and test coverage.
- Scope boundary: teacher workbench, class management, course system, automatic training plan, multi-version rewriting, complex profile editing, multi-agent orchestration, and mandatory vector retrieval are excluded from implementation.
- Type consistency: `EssayTypeValue`, `RejectLabelValue`, `MemorySnapshot`, and `ReviewResult` are introduced before later tasks use them.

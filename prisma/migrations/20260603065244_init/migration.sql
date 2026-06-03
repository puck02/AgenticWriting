-- CreateEnum
CREATE TYPE "UploadPurpose" AS ENUM ('PROMPT', 'CONTENT');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('OCR', 'REVIEW', 'REVIEW_REPAIR', 'MEMORY_RETRIEVAL', 'MEMORY_UPDATE');

-- CreateEnum
CREATE TYPE "AiRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "MemoryEventType" AS ENUM ('SUGGESTION_ACCEPTED', 'SUGGESTION_REJECTED', 'ERROR_PATTERN_OBSERVED', 'EXPRESSION_ADDED', 'MEMORY_DELETED', 'MEMORY_RESTORED');

-- CreateEnum
CREATE TYPE "EssayType" AS ENUM ('ENGLISH_ONE_PICTURE', 'ENGLISH_TWO_CHART', 'SMALL_APPLICATION');

-- CreateEnum
CREATE TYPE "RejectLabel" AS ENUM ('TOO_COMPLEX', 'NOT_MY_STYLE', 'MEANING_CHANGED', 'NOT_EXAM_STYLE', 'PREFER_ORIGINAL', 'UNFAMILIAR_WORDS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Essay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "EssayType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "overallScore" INTEGER,
    "reviewSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Essay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSuggestion" (
    "id" TEXT NOT NULL,
    "essayId" TEXT NOT NULL,
    "originalSentence" TEXT NOT NULL,
    "suggestedSentence" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "preferenceLabel" TEXT NOT NULL,
    "expressionIntent" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "profileExplanation" TEXT,
    "accepted" BOOLEAN,
    "rejectLabel" "RejectLabel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "acceptCount" INTEGER NOT NULL DEFAULT 0,
    "rejectCount" INTEGER NOT NULL DEFAULT 0,
    "essayType" "EssayType" NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WritingPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorPattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "essayType" "EssayType" NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpressionAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "essayType" "EssayType" NOT NULL,
    "topic" TEXT NOT NULL,
    "expressionIntent" TEXT NOT NULL,
    "originalSentence" TEXT NOT NULL,
    "optimizedSentence" TEXT NOT NULL,
    "reuseCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpressionAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "UploadPurpose" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "ocrStatus" "OcrStatus" NOT NULL,
    "rawText" TEXT,
    "normalizedText" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "essayId" TEXT,
    "uploadAssetId" TEXT,
    "correlationId" TEXT,
    "agentType" "AgentType" NOT NULL,
    "model" TEXT NOT NULL,
    "status" "AiRunStatus" NOT NULL,
    "inputSummary" TEXT NOT NULL,
    "outputSummary" TEXT,
    "errorMessage" TEXT,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "MemoryEventType" NOT NULL,
    "essayId" TEXT,
    "suggestionId" TEXT,
    "essayType" "EssayType",
    "label" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Essay_userId_createdAt_idx" ON "Essay"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Essay_userId_type_idx" ON "Essay"("userId", "type");

-- CreateIndex
CREATE INDEX "ReviewSuggestion_essayId_idx" ON "ReviewSuggestion"("essayId");

-- CreateIndex
CREATE INDEX "WritingPreference_userId_essayType_deletedAt_idx" ON "WritingPreference"("userId", "essayType", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WritingPreference_userId_label_essayType_key" ON "WritingPreference"("userId", "label", "essayType");

-- CreateIndex
CREATE INDEX "ErrorPattern_userId_essayType_deletedAt_idx" ON "ErrorPattern"("userId", "essayType", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorPattern_userId_label_essayType_key" ON "ErrorPattern"("userId", "label", "essayType");

-- CreateIndex
CREATE INDEX "ExpressionAsset_userId_essayType_deletedAt_idx" ON "ExpressionAsset"("userId", "essayType", "deletedAt");

-- CreateIndex
CREATE INDEX "ExpressionAsset_userId_topic_expressionIntent_idx" ON "ExpressionAsset"("userId", "topic", "expressionIntent");

-- CreateIndex
CREATE UNIQUE INDEX "UploadAsset_storageKey_key" ON "UploadAsset"("storageKey");

-- CreateIndex
CREATE INDEX "UploadAsset_userId_purpose_createdAt_idx" ON "UploadAsset"("userId", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "UploadAsset_userId_ocrStatus_idx" ON "UploadAsset"("userId", "ocrStatus");

-- CreateIndex
CREATE INDEX "AiRun_userId_agentType_createdAt_idx" ON "AiRun"("userId", "agentType", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_userId_status_idx" ON "AiRun"("userId", "status");

-- CreateIndex
CREATE INDEX "AiRun_essayId_agentType_createdAt_idx" ON "AiRun"("essayId", "agentType", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_uploadAssetId_agentType_createdAt_idx" ON "AiRun"("uploadAssetId", "agentType", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_correlationId_idx" ON "AiRun"("correlationId");

-- CreateIndex
CREATE INDEX "MemoryEvent_userId_eventType_createdAt_idx" ON "MemoryEvent"("userId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "MemoryEvent_userId_essayType_createdAt_idx" ON "MemoryEvent"("userId", "essayType", "createdAt");

-- AddForeignKey
ALTER TABLE "Essay" ADD CONSTRAINT "Essay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSuggestion" ADD CONSTRAINT "ReviewSuggestion_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "Essay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingPreference" ADD CONSTRAINT "WritingPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorPattern" ADD CONSTRAINT "ErrorPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpressionAsset" ADD CONSTRAINT "ExpressionAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadAsset" ADD CONSTRAINT "UploadAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "Essay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_uploadAssetId_fkey" FOREIGN KEY ("uploadAssetId") REFERENCES "UploadAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEvent" ADD CONSTRAINT "MemoryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

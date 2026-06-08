-- AlterTable
ALTER TABLE "UploadAsset" ADD COLUMN "essayId" TEXT;

-- CreateIndex
CREATE INDEX "UploadAsset_essayId_purpose_createdAt_idx" ON "UploadAsset"("essayId", "purpose", "createdAt");

-- AddForeignKey
ALTER TABLE "UploadAsset" ADD CONSTRAINT "UploadAsset_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "Essay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

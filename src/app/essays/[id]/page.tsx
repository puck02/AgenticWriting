import { notFound } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { EssayUploadGallery } from "@/components/EssayUploadGallery";
import { InteractiveEssayReview } from "@/components/InteractiveEssayReview";
import { essayTypes } from "@/domain/labels";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

export default async function EssayDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser(db);
  const essay = await db.essay.findFirst({
    where: { id, userId: user.id },
    include: {
      suggestions: {
        orderBy: { createdAt: "asc" }
      },
      uploadAssets: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!essay) {
    notFound();
  }

  const essayTypeLabel =
    essayTypes.find((essayType) => essayType.value === essay.type)?.label ??
    essay.type;
  const acceptedCount = essay.suggestions.filter(
    (suggestion) => suggestion.accepted === true
  ).length;
  const rejectedCount = essay.suggestions.filter(
    (suggestion) => suggestion.accepted === false
  ).length;

  return (
    <main className="writing-shell min-h-screen">
      <AppNav user={user} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="writing-panel p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="coach-eyebrow">{essayTypeLabel}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[var(--aw-text)] sm:text-3xl">
                批改复盘
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--aw-text-muted)]">
                {essay.reviewSummary ?? "本次批改暂无摘要。"}
              </p>
            </div>
            <div className="grid min-w-64 grid-cols-3 gap-2 text-center">
              <div className="rounded-[14px] bg-[var(--aw-text)] px-3 py-3 text-[#f9fbff]">
                <p className="text-xs text-[#d6d6dc]">总分</p>
                <p className="mt-1 text-2xl font-semibold">
                  {essay.overallScore ?? "--"}
                </p>
              </div>
              <div className="rounded-[14px] border border-[var(--aw-border)] bg-[var(--aw-surface-raised)] px-3 py-3">
                <p className="text-xs text-[var(--aw-text-muted)]">已采纳</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--aw-success)]">
                  {acceptedCount}
                </p>
              </div>
              <div className="rounded-[14px] border border-[var(--aw-border)] bg-[var(--aw-surface-raised)] px-3 py-3">
                <p className="text-xs text-[var(--aw-text-muted)]">不采纳</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--aw-text-muted)]">
                  {rejectedCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        <EssayUploadGallery
          uploads={essay.uploadAssets.map((upload) => ({
            id: upload.id,
            purpose: upload.purpose,
            fileName: upload.fileName,
            mimeType: upload.mimeType,
            normalizedText: upload.normalizedText
          }))}
        />

        <InteractiveEssayReview
          essayId={essay.id}
          content={essay.content}
          suggestions={essay.suggestions.map((suggestion) => ({
            id: suggestion.id,
            originalSentence: suggestion.originalSentence,
            suggestedSentence: suggestion.suggestedSentence,
            reason: suggestion.reason,
            profileExplanation: suggestion.profileExplanation,
            accepted: suggestion.accepted,
            rejectLabel: suggestion.rejectLabel
          }))}
        />
      </div>
    </main>
  );
}

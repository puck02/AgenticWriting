import { notFound } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { InteractiveEssayReview } from "@/components/InteractiveEssayReview";
import { essayTypes } from "@/domain/labels";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";

export default async function EssayDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateCurrentUser(db);
  const essay = await db.essay.findFirst({
    where: { id, userId: user.id },
    include: {
      suggestions: {
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
    <main className="min-h-screen bg-paper">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-700">{essayTypeLabel}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                批改结果
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {essay.reviewSummary ?? "本次批改暂无摘要。"}
              </p>
            </div>
            <div className="grid min-w-64 grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-slate-950 px-3 py-3 text-white">
                <p className="text-xs text-slate-300">总分</p>
                <p className="mt-1 text-2xl font-semibold">
                  {essay.overallScore ?? "--"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 px-3 py-3">
                <p className="text-xs text-slate-500">已采纳</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-700">
                  {acceptedCount}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 px-3 py-3">
                <p className="text-xs text-slate-500">不采纳</p>
                <p className="mt-1 text-2xl font-semibold text-slate-700">
                  {rejectedCount}
                </p>
              </div>
            </div>
          </div>
        </section>

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

import { notFound } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { SuggestionCard } from "@/components/SuggestionCard";
import { essayTypes } from "@/domain/labels";
import { db } from "@/lib/db";
import { canAccessUserResource, getOrCreateCurrentUser } from "@/lib/session";

export default async function EssayDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateCurrentUser(db);
  const essay = await db.essay.findUnique({
    where: { id },
    include: {
      suggestions: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (
    !essay ||
    !canAccessUserResource({
      currentUserId: user.id,
      resourceUserId: essay.userId
    })
  ) {
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

        <section className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">原文</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {essay.content}
            </p>
          </aside>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">逐句建议</h2>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-600">
                {essay.suggestions.length} 条
              </span>
            </div>
            <div className="space-y-4">
              {essay.suggestions.length > 0 ? (
                essay.suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    essayId={essay.id}
                    suggestionId={suggestion.id}
                    originalSentence={suggestion.originalSentence}
                    suggestedSentence={suggestion.suggestedSentence}
                    reason={suggestion.reason}
                    profileExplanation={suggestion.profileExplanation}
                    accepted={suggestion.accepted}
                    rejectLabel={suggestion.rejectLabel}
                  />
                ))
              ) : (
                <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  暂无逐句建议。
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

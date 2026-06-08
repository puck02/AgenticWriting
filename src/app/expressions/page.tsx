import { AppNav } from "@/components/AppNav";
import { essayTypes } from "@/domain/labels";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

export default async function ExpressionsPage() {
  const user = await requireCurrentUser(db);
  const expressions = await db.expressionAsset.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: [{ essayType: "asc" }, { createdAt: "desc" }]
  });

  return (
    <main className="min-h-screen bg-paper">
      <AppNav user={user} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-semibold text-sky-700">个人表达库</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
            已采纳表达
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            采纳过的句子会保存在这里，后续批改会优先参考你的表达习惯。
          </p>
        </div>

        {expressions.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {expressions.map((expression) => (
              <article
                key={expression.id}
                className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-sky-700">
                      {formatEssayType(expression.essayType)}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-slate-950">
                      {expression.topic}
                    </h2>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-600">
                    复用 {expression.reuseCount} 次
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm leading-6">
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-slate-500">
                      原句
                    </p>
                    <p className="text-slate-700">{expression.originalSentence}</p>
                  </div>
                  <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-emerald-700">
                      优化表达
                    </p>
                    <p className="text-slate-950">
                      {expression.optimizedSentence}
                    </p>
                  </div>
                  <p className="text-slate-600">
                    <span className="font-medium text-slate-800">用途：</span>
                    {expression.expressionIntent}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            暂无表达资产。到批改结果页采纳建议后，这里会出现可复用表达。
          </p>
        )}
      </div>
    </main>
  );
}

function formatEssayType(essayType: string): string {
  return essayTypes.find((type) => type.value === essayType)?.label ?? essayType;
}

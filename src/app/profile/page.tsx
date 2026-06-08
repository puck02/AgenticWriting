import { AppNav } from "@/components/AppNav";
import { essayTypes } from "@/domain/labels";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireCurrentUser(db);
  const [preferences, errorPatterns] = await Promise.all([
    db.writingPreference.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: [{ essayType: "asc" }, { updatedAt: "desc" }]
    }),
    db.errorPattern.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: [{ essayType: "asc" }, { updatedAt: "desc" }]
    })
  ]);

  return (
    <main className="min-h-screen bg-paper">
      <AppNav user={user} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-semibold text-sky-700">我的写作画像</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
            偏好与错误模式
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            这里汇总当前仍有效的表达偏好和高频问题，用于下一次作文批改。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-slate-950">表达偏好</h2>
            <div className="mt-4 space-y-3">
              {preferences.length > 0 ? (
                preferences.map((preference) => (
                  <article
                    key={preference.id}
                    className="rounded-md border border-slate-200 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-950">
                          {preference.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatEssayType(preference.essayType)}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600">
                        采纳 {preference.acceptCount} / 不采纳{" "}
                        {preference.rejectCount}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                  暂无表达偏好。采纳或拒绝逐句建议后会逐步形成画像。
                </p>
              )}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-slate-950">错误模式</h2>
            <div className="mt-4 space-y-3">
              {errorPatterns.length > 0 ? (
                errorPatterns.map((pattern) => (
                  <article
                    key={pattern.id}
                    className="rounded-md border border-slate-200 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-950">
                          {pattern.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatEssayType(pattern.essayType)}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600">出现 {pattern.count} 次</p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                  暂无错误模式。提交作文后会记录主要问题。
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function formatEssayType(essayType: string): string {
  return essayTypes.find((type) => type.value === essayType)?.label ?? essayType;
}

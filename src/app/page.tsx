import { AppNav } from "@/components/AppNav";
import { EssaySubmitForm } from "@/components/EssaySubmitForm";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { getPublicModelSettings } from "@/services/ai/model-settings-service";

export default async function HomePage() {
  const user = await requireCurrentUser(db);
  const modelSettings = await getPublicModelSettings({ db });

  return (
    <main className="writing-shell min-h-screen">
      <AppNav user={user} />
      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6">
        <div className="writing-panel p-4 sm:p-6">
          <div className="mb-5 border-b border-[var(--aw-border)] pb-4">
            <p className="coach-eyebrow">新建批改</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[var(--aw-text)] sm:text-3xl">
              写作教练工作台
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--aw-text-muted)]">
              先写出真实表达，再通过 hint、逐句 lesson 和迁移练习，把批改变成可复用的表达能力。
            </p>
          </div>
          <EssaySubmitForm defaultModel={modelSettings.defaultModel} />
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            ["1", "保留真实表达", "不要先润色，系统需要看见你的原始句式和用词习惯。"],
            ["2", "卡住再要 hint", "引导模式只给一句轻提示，帮助你继续写，不替你完成整篇。"],
            ["3", "复盘做迁移", "采纳前先写一句迁移练习，让表达真正进入你的可用库。"]
          ].map(([step, title, copy]) => (
            <article key={step} className="writing-panel p-4">
              <p className="text-sm font-semibold text-[var(--aw-accent)]">{step}</p>
              <h2 className="mt-2 text-base font-semibold text-[var(--aw-text)]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--aw-text-muted)]">
                {copy}
              </p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

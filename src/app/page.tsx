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
          <div className="mb-5">
            <p className="coach-eyebrow">新建批改</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[var(--aw-text)] sm:text-3xl">
              写作教练工作台
            </h1>
          </div>
          <EssaySubmitForm defaultModel={modelSettings.defaultModel} />
        </div>
      </section>
    </main>
  );
}

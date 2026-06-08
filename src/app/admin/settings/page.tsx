import { redirect } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { ModelSettingsPanel } from "@/components/ModelSettingsPanel";
import { db } from "@/lib/db";
import { isAdminUser, requireCurrentUser } from "@/lib/session";
import { getPublicModelSettings } from "@/services/ai/model-settings-service";

export default async function AdminSettingsPage() {
  const user = await requireCurrentUser(db);

  if (!isAdminUser(user)) {
    redirect("/");
  }

  const settings = await getPublicModelSettings({ db });

  return (
    <main className="writing-shell min-h-screen">
      <AppNav user={user} />
      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-bold text-[#14866d]">管理员</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal text-[#3f3426] sm:text-3xl">
            模型设置
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#725d42]">
            配置批改和引导模式使用的模型服务地址、密钥和默认模型。
          </p>
        </div>
        <ModelSettingsPanel initialSettings={settings} />
      </section>
    </main>
  );
}

import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { IslandGlyph } from "@/components/IslandUi";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser(db);

  if (user) {
    redirect("/");
  }

  return (
    <main className="writing-shell grid min-h-screen place-items-center px-4 py-10">
      <section className="writing-panel w-full max-w-md p-5 sm:p-6">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex">
            <IslandGlyph label="写作教练">W</IslandGlyph>
          </div>
          <p className="text-sm font-bold text-[#14866d]">登录</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal text-[#3f3426]">
            进入写作教练
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#725d42]">
            登录后即可提交作文、查看写作画像和个人表达库。
          </p>
        </div>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}

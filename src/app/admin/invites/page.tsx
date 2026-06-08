import { redirect } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { InvitationAdminPanel } from "@/components/InvitationAdminPanel";
import { db } from "@/lib/db";
import { isAdminUser, requireCurrentUser } from "@/lib/session";

export default async function AdminInvitesPage() {
  const user = await requireCurrentUser(db);

  if (!isAdminUser(user)) {
    redirect("/");
  }

  const invitations = await db.invitationCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      usedBy: {
        select: {
          email: true
        }
      }
    }
  });

  return (
    <main className="writing-shell min-h-screen">
      <AppNav user={user} />
      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-bold text-[#14866d]">管理员</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal text-[#3f3426] sm:text-3xl">
            邀请码管理
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#725d42]">
            生成一次性邀请码，用于控制新用户注册入口。
          </p>
        </div>
        <InvitationAdminPanel
          initialInvitations={invitations.map((invitation) => ({
            id: invitation.id,
            codePreview: invitation.codePreview,
            usedAt: invitation.usedAt,
            usedByEmail: invitation.usedBy?.email ?? null,
            createdAt: invitation.createdAt
          }))}
        />
      </section>
    </main>
  );
}

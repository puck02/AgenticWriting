"use client";

import { useState } from "react";

import { IslandButton } from "@/components/IslandUi";

type InvitationItem = {
  id: string;
  codePreview: string;
  usedAt: string | Date | null;
  usedByEmail: string | null;
  createdAt: string | Date;
};

export function InvitationAdminPanel({
  initialInvitations
}: {
  initialInvitations: InvitationItem[];
}) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function createInvite() {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/invitations", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as {
        code?: string;
        invitation?: InvitationItem;
        error?: string;
      };

      if (!response.ok || !data.code || !data.invitation) {
        throw new Error(data.error ?? "邀请码生成失败。");
      }

      setNewCode(data.code);
      setInvitations((current) => [data.invitation!, ...current]);
      setMessage("邀请码已生成，只会完整显示这一次。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "邀请码生成失败。");
    } finally {
      setIsPending(false);
    }
  }

  async function copyCode() {
    if (!newCode) {
      return;
    }

    await navigator.clipboard?.writeText(newCode);
    setMessage("邀请码已复制。");
  }

  return (
    <div className="space-y-5">
      <section className="writing-panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-[#3f3426]">生成邀请码</h2>
            <p className="mt-1 text-sm text-[#725d42]">
              每个邀请码只能注册一个新用户。
            </p>
          </div>
          <IslandButton
            type="button"
            onClick={createInvite}
            disabled={isPending}
            loading={isPending}
            loadingLabel="生成中..."
            variant="primary"
            size="middle"
          >
            生成邀请码
          </IslandButton>
        </div>

        {newCode ? (
          <div className="mt-4 rounded-[18px] border-2 border-[#82d5bb]/50 bg-[#fffdf4] p-4">
            <p className="text-xs font-black text-[#14866d]">新邀请码</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="block flex-1 break-all rounded-md bg-[#f7f3df] px-3 py-2 text-sm font-black text-[#3f3426]">
                {newCode}
              </code>
              <button type="button" onClick={copyCode} className="review-copy-button">
                复制
              </button>
            </div>
          </div>
        ) : null}

        {message ? <p className="mt-3 text-sm font-bold text-[#725d42]">{message}</p> : null}
      </section>

      <section className="writing-panel p-4 sm:p-5">
        <h2 className="text-lg font-black text-[#3f3426]">最近邀请码</h2>
        <div className="mt-4 space-y-3">
          {invitations.length > 0 ? (
            invitations.map((invitation) => (
              <article
                key={invitation.id}
                className="rounded-[18px] border-2 border-[#725d42]/10 bg-[#fffdf4]/75 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-[#3f3426]">
                      {invitation.codePreview}
                    </p>
                    <p className="mt-1 text-xs text-[#725d42]">
                      创建于 {formatDate(invitation.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#f7f3df] px-3 py-1 text-xs font-black text-[#725d42]">
                    {invitation.usedAt
                      ? `已使用：${invitation.usedByEmail ?? "未知用户"}`
                      : "未使用"}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-[18px] bg-[#fffdf4]/75 p-4 text-sm text-[#725d42]">
              暂无邀请码。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

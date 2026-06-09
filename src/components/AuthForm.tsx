"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { IslandButton, IslandGlyph } from "@/components/IslandUi";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister ? { email, password, invitationCode } : { email, password }
        )
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "请求失败，请稍后重试。");
      }

      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "请求失败。");
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--aw-text-muted)]"
        >
          <IslandGlyph label="邮箱">M</IslandGlyph>
          邮箱
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="auth-input"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--aw-text-muted)]"
        >
          <IslandGlyph label="密码">K</IslandGlyph>
          密码
        </label>
        <input
          id="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={isRegister ? 8 : undefined}
          required
          className="auth-input"
          placeholder={isRegister ? "至少 8 个字符" : "输入密码"}
        />
      </div>

      {isRegister ? (
        <div className="space-y-2">
          <label
            htmlFor="invitationCode"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--aw-text-muted)]"
          >
            <IslandGlyph label="邀请码">I</IslandGlyph>
            邀请码
          </label>
          <input
            id="invitationCode"
            value={invitationCode}
            onChange={(event) => setInvitationCode(event.target.value)}
            required
            className="auth-input"
            placeholder="管理员生成的一次性邀请码"
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <IslandButton
        type="submit"
        disabled={isPending}
        loading={isPending}
        loadingLabel={isRegister ? "正在注册..." : "正在登录..."}
        variant="primary"
        size="large"
        className="w-full"
      >
        {isRegister ? "注册并进入" : "登录"}
      </IslandButton>

      <p className="text-center text-sm text-[var(--aw-text-muted)]">
        {isRegister ? "已有账号？" : "还没有账号？"}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="ml-1 font-semibold text-[var(--aw-accent)] hover:underline"
        >
          {isRegister ? "去登录" : "使用邀请码注册"}
        </Link>
      </p>
    </form>
  );
}

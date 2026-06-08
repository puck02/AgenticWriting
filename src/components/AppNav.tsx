"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { IslandGlyph } from "@/components/IslandUi";

const navItems = [
  { href: "/", label: "新建批改" },
  { href: "/profile", label: "我的写作画像" },
  { href: "/expressions", label: "个人表达库" }
];

type AppNavUser = {
  email: string;
  role: "USER" | "ADMIN";
};

export function AppNav({ user }: { user?: AppNavUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleNavItems =
    user?.role === "ADMIN"
      ? [
          ...navItems,
          { href: "/admin/invites", label: "邀请码" },
          { href: "/admin/settings", label: "模型设置" }
        ]
      : navItems;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b-2 border-[#725d42]/10 bg-[#fffdf4]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-black tracking-normal text-[#3f3426]"
        >
          <IslandGlyph label="写作教练">W</IslandGlyph>
          考研英语写作教练
        </Link>
        <div className="flex flex-col gap-3 sm:items-end">
          <nav className="flex flex-wrap gap-2 text-sm">
            {visibleNavItems.map((item) => {
              const isCurrent = isCurrentNavItem(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={[
                    "island-button island-button-small",
                    isCurrent
                      ? "island-button-primary nav-link-active"
                      : "island-button-default"
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {user ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#725d42]">
              <span>{user.email}</span>
              <button type="button" onClick={handleLogout} className="nav-logout-button">
                退出
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function isCurrentNavItem(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/essays");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

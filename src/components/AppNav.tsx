"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IslandGlyph } from "@/components/IslandUi";

const navItems = [
  { href: "/", label: "新建批改" },
  { href: "/profile", label: "我的写作画像" },
  { href: "/expressions", label: "个人表达库" }
];

export function AppNav() {
  const pathname = usePathname();

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
        <nav className="flex flex-wrap gap-2 text-sm">
          {navItems.map((item) => {
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

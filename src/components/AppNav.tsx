import Link from "next/link";

const navItems = [
  { href: "/", label: "新建批改" },
  { href: "/profile", label: "我的写作画像" },
  { href: "/expressions", label: "个人表达库" }
];

export function AppNav() {
  return (
    <header className="border-b border-slate-200 bg-white/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-normal text-slate-950"
        >
          考研英语写作教练
        </Link>
        <nav className="flex flex-wrap gap-2 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

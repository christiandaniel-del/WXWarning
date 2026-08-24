"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/map", label: "Map", icon: "🗺" },
  { href: "/alerts", label: "Alerts", icon: "☰" },
  { href: "/airports", label: "Airports", icon: "✈" },
  { href: "/cyclones", label: "Cyclones", icon: "🌀" },
  { href: "/volcanoes", label: "Volcanoes", icon: "▲" },
  { href: "/earthquakes", label: "Quakes", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-raised text-ink font-medium"
          : "text-muted hover:text-ink hover:bg-raised/60"
      )}
    >
      <span aria-hidden className="w-5 text-center">
        {icon}
      </span>
      {label}
    </Link>
  );
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-edge bg-elevated">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-edge">
        <span className="font-semibold tracking-tight">◼ WXWarning</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
      <div className="mt-auto p-4 text-xs text-muted">v1.0 · not for operational use</div>
    </aside>
  );
}

export function BottomTabs() {
  const pathname = usePathname();
  const tabs = NAV.filter((n) =>
    ["/dashboard", "/map", "/alerts"].includes(n.href)
  ).concat([{ href: "/settings", label: "More", icon: "⋯" }]);
  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-edge bg-elevated"
    >
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={isActive(pathname, t.href) ? "page" : undefined}
          className={clsx(
            "flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs",
            isActive(pathname, t.href) ? "text-ink" : "text-muted"
          )}
        >
          <span aria-hidden>{t.icon}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

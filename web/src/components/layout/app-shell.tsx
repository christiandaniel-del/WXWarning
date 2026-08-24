"use client";

import { SideNav, BottomTabs } from "./nav";
import { UtcClock } from "@/components/ui/status";
import { LiveStatus } from "@/components/ui/live-status";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { displayName: string; role: string };
}) {
  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-edge bg-elevated px-4">
          <span className="lg:hidden font-semibold">◼ WXWarning</span>
          <LiveStatus />
          <UtcClock />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted">
              {user.displayName} · {user.role}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-edge px-3 py-1.5 text-xs text-muted hover:text-ink"
            >
              Keluar
            </button>
          </div>
        </header>
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <BottomTabs />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

function utcStamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}${p(d.getUTCHours())}${p(
    d.getUTCMinutes()
  )}Z`;
}

export function UtcClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(utcStamp(new Date()));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-sm text-muted" suppressHydrationWarning>
      {now ?? "--:--Z"}
    </span>
  );
}

export function LivePill({ state = "live" }: { state?: "live" | "reconnecting" | "offline" }) {
  if (state === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-live/40 bg-live/10 px-2.5 py-1 text-xs font-medium text-live">
        <span className="h-2 w-2 rounded-full bg-live" aria-hidden />
        LIVE
      </span>
    );
  }
  if (state === "reconnecting") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-severe/40 bg-severe/10 px-2.5 py-1 text-xs font-medium text-severe">
        <span className="h-2 w-2 animate-pulse rounded-full bg-severe" aria-hidden />
        RECONNECTING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-extreme/40 bg-extreme/10 px-2.5 py-1 text-xs font-medium text-extreme">
      <span className="h-2 w-2 rounded-full bg-extreme" aria-hidden />
      OFFLINE
    </span>
  );
}

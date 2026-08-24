"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WatchButton({
  icao,
  initialItemId,
}: {
  icao: string;
  initialItemId: string | null;
}) {
  const router = useRouter();
  const [itemId, setItemId] = useState<string | null>(initialItemId);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (itemId) {
        const res = await fetch(`/api/v1/me/watchlist/${itemId}`, {
          method: "DELETE",
        });
        if (res.ok) setItemId(null);
      } else {
        const res = await fetch("/api/v1/me/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "airport", icao }),
        });
        if (res.ok) {
          const json = await res.json();
          setItemId(json.data.id);
        }
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={itemId ? `Hapus ${icao} dari watchlist` : `Tambah ${icao} ke watchlist`}
      aria-pressed={!!itemId}
      className="rounded-lg px-2.5 py-1.5 text-base leading-none transition-colors hover:bg-raised disabled:opacity-50"
    >
      <span className={itemId ? "text-moderate" : "text-muted"}>
        {itemId ? "★" : "☆"}
      </span>
    </button>
  );
}

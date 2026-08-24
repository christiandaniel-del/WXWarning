"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AckButton({
  hazardId,
  acked,
}: {
  hazardId: string;
  acked: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    acked ? "done" : "idle"
  );

  async function ack() {
    setState("sending");
    try {
      const res = await fetch(`/api/v1/hazards/${hazardId}/acknowledge`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("gagal");
      setState("done");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-live/40 bg-live/10 px-3 py-1.5 text-xs font-medium text-live">
        ✓ Acknowledged
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={ack}
      disabled={state === "sending"}
      className="rounded-lg border border-edge bg-elevated px-4 py-1.5 text-xs font-medium text-ink hover:border-muted disabled:opacity-50"
    >
      {state === "sending" ? "Mengirim…" : "Acknowledge"}
      {state === "error" && " — gagal, coba lagi"}
    </button>
  );
}

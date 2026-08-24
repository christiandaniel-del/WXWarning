"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ConnState = "live" | "reconnecting" | "offline";

export function useLiveStream(onHazard?: (h: unknown) => void) {
  const [conn, setConn] = useState<ConnState>("reconnecting");
  const esRef = useRef<EventSource | null>(null);
  const cbRef = useRef(onHazard);
  cbRef.current = onHazard;

  useEffect(() => {
    const es = new EventSource("/api/stream");
    esRef.current = es;

    es.onopen = () => setConn("live");
    es.onerror = () => setConn("reconnecting");
    es.addEventListener("hello", () => setConn("live"));
    es.addEventListener("hazard.created", (e) => {
      try {
        cbRef.current?.(JSON.parse((e as MessageEvent).data));
      } catch {}
    });

    return () => es.close();
  }, []);

  return conn;
}

export function LiveStatus() {
  const router = useRouter();
  const [conn, setConn] = useState<ConnState>("reconnecting");
  const [count, setCount] = useState(0);

  const conn2 = useLiveStream(() => {
    setCount((c) => c + 1);
    router.refresh();
  });

  useEffect(() => setConn(conn2), [conn2]);

  const pill =
    conn === "live"
      ? "border-live/40 bg-live/10 text-live"
      : conn === "reconnecting"
        ? "border-severe/40 bg-severe/10 text-severe"
        : "border-extreme/40 bg-extreme/10 text-extreme";

  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${pill}`}
        title={`Koneksi real-time: ${conn}`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            conn === "live" ? "bg-live" : conn === "reconnecting" ? "animate-pulse bg-severe" : "bg-extreme"
          }`}
          aria-hidden
        />
        {conn.toUpperCase()}
      </span>

      <button
        type="button"
        onClick={() => {
          setCount(0);
          router.push("/alerts");
        }}
        aria-label={`Notifikasi: ${count} alert baru`}
        className="rounded-lg border border-edge px-3 py-1.5 text-xs text-muted hover:text-ink"
      >
        🔔 {count > 0 ? <span className="text-extreme font-bold">{count}</span> : 0}
      </button>
    </div>
  );
}

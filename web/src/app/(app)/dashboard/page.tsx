import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { hazards } from "@/db/schema";
import { AlertCard, type AlertCardData } from "@/components/ui/alert-card";
import type { Severity } from "@/components/ui/severity-badge";

const SAMPLE_FALLBACK: AlertCardData[] = [
  {
    id: "demo",
    type: "INFO",
    severity: "info",
    title: "Belum ada hazard di database. Jalankan ingest untuk mengambil data real.",
    area: "POST /api/admin/ingest",
    age: "—",
  },
];

function ageLabel(from: Date): string {
  const mins = Math.max(0, Math.round((Date.now() - from.getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.round(mins / 60)}h`;
}

async function getActiveHazards(): Promise<AlertCardData[]> {
  try {
    const rows = await db
      .select()
      .from(hazards)
      .where(eq(hazards.status, "ACTIVE"))
      .orderBy(desc(hazards.createdAt))
      .limit(20);

    return rows.map((h) => ({
      id: h.id,
      type: h.type.toUpperCase(),
      severity: h.severity as Severity,
      title: h.title,
      area: `${h.areaText ?? ""} · s/d ${h.validUntil.toISOString().slice(11, 16)}Z`,
      age: ageLabel(h.createdAt),
    }));
  } catch {
    return SAMPLE_FALLBACK;
  }
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const alerts = await getActiveHazards();

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-3">
        {["BMKG", "JTWC", "VAAC", "PVMBG", "USGS"].map((s) => (
          <span
            key={s}
            className="shrink-0 rounded-full border border-edge bg-elevated px-3 py-1 text-xs text-muted"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="active-alerts">
          <div className="mb-3 flex items-center justify-between">
            <h1 id="active-alerts" className="text-lg font-semibold">
              Active Alerts{" "}
              <span className="text-sm font-normal text-muted">
                ({alerts.length})
              </span>
            </h1>
            <button className="rounded-lg border border-edge px-3 py-1.5 text-xs text-muted hover:text-ink">
              Filter ▾
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {alerts.map((a) => (
              <AlertCard key={a.id} data={a} />
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section
            aria-labelledby="source-health"
            className="rounded-[var(--radius-card)] border border-edge bg-elevated p-4"
          >
            <h2
              id="source-health"
              className="text-sm font-semibold tracking-wide text-muted uppercase"
            >
              Source Health
            </h2>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
              {["BMKG", "JTWC", "VAAC-TYO", "VAAC-DRW", "USGS"].map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-live" aria-hidden />
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Trigger ingest:{" "}
              <code className="font-mono text-ink">POST /api/admin/ingest</code>
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

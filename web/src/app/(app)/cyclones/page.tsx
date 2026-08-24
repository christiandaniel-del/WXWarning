import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cyclonePoints, cyclones, hazards } from "@/db/schema";
import { PageHeader } from "@/components/layout/placeholder";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { fmtUtc } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CyclonesPage() {
  const rows = await db
    .select({
      id: cyclones.id,
      hazardId: cyclones.hazardId,
      name: cyclones.name,
      designator: cyclones.internationalDesignator,
      category: cyclones.category,
      severity: hazards.severity,
      validUntil: hazards.validUntil,
    })
    .from(cyclones)
    .innerJoin(hazards, eq(cyclones.hazardId, hazards.id))
    .where(eq(hazards.status, "ACTIVE"))
    .orderBy(desc(hazards.createdAt));

  const details = [];
  for (const row of rows) {
    const points = await db
      .select()
      .from(cyclonePoints)
      .where(inArray(cyclonePoints.cycloneId, [row.id]));
    const current = points.filter((p) => !p.isForecast).at(-1);
    const fc = points.filter((p) => p.isForecast).at(-1);
    details.push({ ...row, current, lastForecast: fc, total: points.length });
  }

  return (
    <>
      <PageHeader
        title="Cyclones"
        subtitle={`${rows.length} siklon aktif · sumber: JMA Tokyo (WPAC)`}
      />
      <div className="grid gap-4 px-4 py-4 lg:grid-cols-2 lg:px-6">
        {details.length === 0 && (
          <div className="rounded-[var(--radius-card)] border border-edge bg-elevated p-10 text-center text-sm text-muted lg:col-span-2">
            Tidak ada siklon aktif.
          </div>
        )}
        {details.map((c) => (
          <article
            key={c.id}
            className="rounded-[var(--radius-card)] border border-edge bg-elevated p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl" aria-hidden>
                🌀
              </span>
              <h2 className="font-semibold">
                {c.category} {c.designator}{" "}
                <span className="text-severe">{c.name}</span>
              </h2>
              <div className="ml-auto">
                <SeverityBadge severity={c.severity} size="sm" />
              </div>
            </div>

            {c.current ? (
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Item k="Posisi" v={`${c.current.lat.toFixed(1)}°, ${c.current.lon.toFixed(1)}°`} />
                <Item k="Angin" v={`${c.current.maxWindKt ?? "?"} kt G${c.current.gustKt ?? "?"}`} />
                <Item k="Tekanan" v={`${c.current.pressureHpa ?? "?"} hPa`} />
                <Item k="Analisis" v={fmtUtc(c.current.validTime)} />
                {c.lastForecast?.uncertaintyRadiusKm != null && (
                  <Item
                    k="Cone terjauh"
                    v={`±${c.lastForecast.uncertaintyRadiusKm} km`}
                  />
                )}
                <Item k="Titik track" v={`${c.total}`} />
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted">Data track belum tersedia.</p>
            )}

            <div className="mt-4 flex gap-2">
              <a
                href={`/map`}
                className="rounded-lg border border-edge px-3 py-1.5 text-xs text-info hover:bg-info/10"
              >
                Lihat di peta ↗
              </a>
              <a
                href={`/alerts/${c.hazardId}`}
                className="rounded-lg border border-edge px-3 py-1.5 text-xs text-muted hover:text-ink"
              >
                Detail alert →
              </a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="font-mono text-sm">{v}</dd>
    </div>
  );
}

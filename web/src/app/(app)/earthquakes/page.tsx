import { desc, gte } from "drizzle-orm";
import { db } from "@/db";
import { earthquakes } from "@/db/schema";
import { PageHeader } from "@/components/layout/placeholder";
import { fmtAgo, fmtUtc } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EarthquakesPage() {
  const rows = await db
    .select()
    .from(earthquakes)
    .where(gte(earthquakes.magnitude, 5))
    .orderBy(desc(earthquakes.occurredAt))
    .limit(100);

  return (
    <>
      <PageHeader
        title="Earthquakes"
        subtitle={`${rows.length} gempa terakhir (M≥5) · sumber: BMKG & USGS`}
      />
      <div className="px-4 py-4 lg:px-6">
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-elevated">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-xs tracking-wide text-muted uppercase">
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Mag</th>
                <th className="px-4 py-3 font-medium">Kedalaman</th>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Koordinat</th>
                <th className="px-4 py-3 font-medium">Tsunami</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-edge/60 last:border-0 hover:bg-raised/50"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs">{fmtUtc(q.occurredAt)}</span>
                    <span className="ml-2 text-xs text-muted">{fmtAgo(q.occurredAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        q.magnitude >= 6.5
                          ? "font-mono font-bold text-extreme"
                          : q.magnitude >= 6
                            ? "font-mono font-bold text-severe"
                            : "font-mono text-moderate"
                      }
                    >
                      M{q.magnitude.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{Math.round(q.depthKm)} km</td>
                  <td className="max-w-sm px-4 py-3">{q.place}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {q.lat.toFixed(2)}°, {q.lon.toFixed(2)}°
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {q.tsunamiFlag ? (
                      <span className="text-extreme">⚠ POTENSI</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

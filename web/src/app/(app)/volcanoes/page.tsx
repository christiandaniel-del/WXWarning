import { asc } from "drizzle-orm";
import { db } from "@/db";
import { volcanoes } from "@/db/schema";
import { PageHeader } from "@/components/layout/placeholder";
import { fmtAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const CODE_STYLE: Record<string, string> = {
  RED: "border-extreme/50 bg-extreme/10 text-extreme",
  ORANGE: "border-severe/50 bg-severe/10 text-severe",
  YELLOW: "border-moderate/50 bg-moderate/10 text-moderate",
  GREEN: "border-live/40 bg-live/10 text-live",
};

const ORDER = { RED: 0, ORANGE: 1, YELLOW: 2, GREEN: 3 } as const;

export default async function VolcanoesPage() {
  const rows = await db
    .select()
    .from(volcanoes)
    .orderBy(asc(volcanoes.lat));

  const sorted = [...rows].sort(
    (a, b) => ORDER[a.colorCode] - ORDER[b.colorCode] || a.name.localeCompare(b.name)
  );

  const counts = sorted.reduce<Record<string, number>>((acc, v) => {
    acc[v.colorCode] = (acc[v.colorCode] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Volcanoes"
        subtitle={`${rows.length} gunung terpantau · ${counts.RED ?? 0} RED · ${counts.ORANGE ?? 0} ORANGE · ${counts.YELLOW ?? 0} YELLOW · sumber: PVMBG MAGMA`}
      />
      <div className="px-4 py-4 lg:px-6">
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-elevated">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-xs tracking-wide text-muted uppercase">
                <th className="px-4 py-3 font-medium">Gunung</th>
                <th className="px-4 py-3 font-medium">Provinsi</th>
                <th className="px-4 py-3 font-medium">Color code</th>
                <th className="px-4 py-3 font-medium">Koordinat</th>
                <th className="px-4 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => (
                <tr
                  key={v.name}
                  className="border-b border-edge/60 last:border-0 hover:bg-raised/50"
                >
                  <td className="px-4 py-3 font-medium">
                    {v.colorCode !== "GREEN" && <span className="mr-1.5">▲</span>}
                    {v.name}
                  </td>
                  <td className="px-4 py-3 text-muted">{v.country === "ID" ? "Indonesia" : v.country}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${CODE_STYLE[v.colorCode]}`}
                    >
                      {v.colorCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {v.lat.toFixed(2)}°, {v.lon.toFixed(2)}°
                  </td>
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    {fmtAgo(v.codeUpdatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Color code dipetakan dari tingkat aktivitas PVMBG: Awas→RED, Siaga→ORANGE,
          Waspada→YELLOW, Normal→GREEN. VONA resmi mengikuti.
        </p>
      </div>
    </>
  );
}

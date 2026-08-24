import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { airports, airportWx, watchlists } from "@/db/schema";
import { PageHeader } from "@/components/layout/placeholder";
import { WatchButton } from "@/components/ui/watch-button";
import { getCurrentUser } from "@/lib/auth";
import { fmtAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const FLT_CAT_STYLE: Record<string, string> = {
  VFR: "border-live/50 bg-live/10 text-live",
  MVFR: "border-info/50 bg-info/10 text-info",
  IFR: "border-severe/50 bg-severe/10 text-severe",
  LIFR: "border-extreme/50 bg-extreme/10 text-extreme",
};

export default async function AirportsPage() {
  const user = await getCurrentUser();

  const all = await db
    .select({ airport: airports, wx: airportWx })
    .from(airports)
    .leftJoin(airportWx, eq(airports.icao, airportWx.icao))
    .orderBy(asc(airports.icao));

  const watched = user
    ? await db
        .select({ id: watchlists.id, icao: watchlists.icao })
        .from(watchlists)
        .where(eq(watchlists.userId, user.id))
    : [];

  const watchedByIcao = new Map(
    watched.filter((w) => w.icao).map((w) => [w.icao as string, w.id])
  );

  const watchlistRows = all.filter((r) => watchedByIcao.has(r.airport.icao));
  const others = all.filter((r) => !watchedByIcao.has(r.airport.icao));

  return (
    <>
      <PageHeader
        title="Airports"
        subtitle={`${all.length} bandara · METAR via NOAA AWC · klik ☆ untuk watchlist`}
      />
      <div className="space-y-6 px-4 py-4 lg:px-6">
        {watchlistRows.length > 0 && (
          <section aria-labelledby="wl-title">
            <h2
              id="wl-title"
              className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase"
            >
              ★ Watchlist ({watchlistRows.length})
            </h2>
            <AirportTable rows={watchlistRows} watched={watchedByIcao} highlight />
          </section>
        )}

        <section aria-labelledby="all-title">
          <h2
            id="all-title"
            className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase"
          >
            Semua bandara ({others.length})
          </h2>
          <AirportTable rows={others} watched={watchedByIcao} />
        </section>
      </div>
    </>
  );
}

function FltCatBadge({ cat }: { cat: string | null }) {
  if (!cat) return <span className="text-xs text-muted">—</span>;
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${FLT_CAT_STYLE[cat] ?? "border-edge text-muted"}`}
    >
      {cat}
    </span>
  );
}

function WxSummary({ wx }: { wx: typeof airportWx.$inferSelect | null }) {
  if (!wx?.metarRaw) return <span className="text-xs text-muted">no data</span>;
  const wind =
    wx.windDir != null ? `${String(wx.windDir).padStart(3, "0")}°/${wx.windKt ?? "?"}kt` : "VRB";
  return (
    <span className="font-mono text-xs text-ink">
      {wind} · {wx.visibKm != null ? `${wx.visibKm}km` : "?"} · {wx.tempC ?? "?"}°C ·
      Q{wx.altimHpa ?? "?"}
    </span>
  );
}

function AirportTable({
  rows,
  watched,
  highlight,
}: {
  rows: Array<{
    airport: typeof airports.$inferSelect;
    wx: typeof airportWx.$inferSelect | null;
  }>;
  watched: Map<string, string>;
  highlight?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-edge bg-elevated p-6 text-center text-sm text-muted">
        Kosong — tambahkan dari tabel di bawah.
      </div>
    );
  }
  return (
    <div
      className={`overflow-x-auto rounded-[var(--radius-card)] border bg-elevated ${
        highlight ? "border-moderate/40" : "border-edge"
      }`}
    >
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-edge text-xs tracking-wide text-muted uppercase">
            <th className="px-4 py-3 font-medium">ICAO/IATA</th>
            <th className="px-4 py-3 font-medium">FLT CAT</th>
            <th className="px-4 py-3 font-medium">METAR ringkas</th>
            <th className="px-4 py-3 font-medium">Obs</th>
            <th className="px-4 py-3 font-medium">Watch</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ airport: a, wx }) => (
            <tr
              key={a.icao}
              className="border-b border-edge/60 last:border-0 hover:bg-raised/50"
            >
              <td className="px-4 py-3">
                <Link href={`/airports/${a.icao}`} className="font-mono hover:text-info">
                  {a.icao}
                </Link>
                {a.iata && <span className="ml-2 text-xs text-muted">{a.iata}</span>}
                <div className="text-xs text-muted">{a.name}</div>
              </td>
              <td className="px-4 py-3">
                <FltCatBadge cat={wx?.fltCat ?? null} />
              </td>
              <td className="px-4 py-3">
                <WxSummary wx={wx} />
              </td>
              <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                {wx?.metarObsAt ? fmtAgo(wx.metarObsAt) : "—"}
              </td>
              <td className="px-4 py-3">
                <WatchButton icao={a.icao} initialItemId={watched.get(a.icao) ?? null} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

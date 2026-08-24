import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { airports, airportWx, hazards, watchlists } from "@/db/schema";
import { WatchButton } from "@/components/ui/watch-button";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { getCurrentUser } from "@/lib/auth";
import { fmtUtc } from "@/lib/format";

export const dynamic = "force-dynamic";

const FLT_CAT_STYLE: Record<string, string> = {
  VFR: "border-live/50 bg-live/10 text-live",
  MVFR: "border-info/50 bg-info/10 text-info",
  IFR: "border-severe/50 bg-severe/10 text-severe",
  LIFR: "border-extreme/50 bg-extreme/10 text-extreme",
};

export default async function AirportDetailPage({
  params,
}: PageProps<"/airports/[icao]">) {
  const { icao } = await params;
  const code = icao.toUpperCase();

  if (!/^[A-Z]{4}$/.test(code)) notFound();

  const [airport] = await db.select().from(airports).where(eq(airports.icao, code));
  if (!airport) notFound();

  const [wx] = await db
    .select()
    .from(airportWx)
    .where(eq(airportWx.icao, code));

  const user = await getCurrentUser();
  let watchedItemId: string | null = null;
  if (user) {
    const wl = await db
      .select({ id: watchlists.id })
      .from(watchlists)
      .where(and(eq(watchlists.userId, user.id), eq(watchlists.icao, code)));
    watchedItemId = wl[0]?.id ?? null;
  }

  const activeHazards = await db
    .select({
      id: hazards.id,
      title: hazards.title,
      type: hazards.type,
      severity: hazards.severity,
    })
    .from(hazards)
    .where(and(eq(hazards.status, "ACTIVE"), gt(hazards.validUntil, new Date())))
    .orderBy(desc(hazards.createdAt))
    .limit(8);

  const stale = !wx || Date.now() - wx.updatedAt.getTime() > 90 * 60 * 1000;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <Link href="/airports" className="text-sm text-muted hover:text-ink">
        ← Airports
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">
          <span className="font-mono">{airport.icao}</span>
          {airport.iata && <span className="ml-2 text-sm text-muted">/{airport.iata}</span>}
        </h1>
        <span className="text-sm text-muted">{airport.name}</span>
        {wx?.fltCat && (
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${FLT_CAT_STYLE[wx.fltCat] ?? ""}`}
          >
            {wx.fltCat}
          </span>
        )}
        <div className="ml-auto">
          <WatchButton icao={airport.icao} initialItemId={watchedItemId} />
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">
        {airport.country} · FIR {airport.firCode ?? "—"} · {airport.lat.toFixed(2)}°,
        {airport.lon.toFixed(2)}°
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-edge bg-elevated p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
              METAR
            </h2>
            <span className="font-mono text-xs text-muted">
              {fmtUtc(wx?.metarObsAt)} {stale && <span className="text-moderate">· STALE</span>}
            </span>
          </div>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-base p-3 font-mono text-xs leading-relaxed">
            {wx?.metarRaw ?? "Belum ada data — jalankan ingest AWC_METAR."}
          </pre>
          {wx?.metarRaw && (
            <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <Stat k="Angin" v={wx.windDir != null ? `${String(wx.windDir).padStart(3, "0")}° ${wx.windKt ?? "?"}kt` : "VRB"} />
              <Stat k="Visibilitas" v={wx.visibKm != null ? `${wx.visibKm} km` : "?"} />
              <Stat k="QNH" v={`${wx.altimHpa ?? "?"} hPa`} />
              <Stat k="Temp/Dew" v={`${wx.tempC ?? "?"}°/${wx.dewpC ?? "?"}°`} />
              <Stat k="Cover" v={wx.cover ?? "?"} />
              <Stat k="FLT CAT" v={wx.fltCat ?? "?"} />
            </dl>
          )}
        </section>

        <section className="rounded-[var(--radius-card)] border border-edge bg-elevated p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
              TAF
            </h2>
            <span className="font-mono text-xs text-muted">{fmtUtc(wx?.tafIssuedAt)}</span>
          </div>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-base p-3 font-mono text-xs leading-relaxed">
            {wx?.tafRaw ?? "Belum ada TAF."}
          </pre>
        </section>
      </div>

      <section className="mt-4 rounded-[var(--radius-card)] border border-edge bg-elevated p-4">
        <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
          Hazard aktif (semua area — filter radius menyusul)
        </h2>
        {activeHazards.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Tidak ada.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {activeHazards.map((h) => (
              <li key={h.id} className="flex items-center gap-3 text-sm">
                <SeverityBadge severity={h.severity} size="sm" />
                <span className="font-mono text-xs text-muted uppercase">{h.type}</span>
                <Link href={`/alerts/${h.id}`} className="truncate hover:text-info">
                  {h.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="font-mono text-sm">{v}</dd>
    </div>
  );
}

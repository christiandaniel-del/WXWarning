import { db } from "@/db";
import { airports, airportWx } from "@/db/schema";
import { fetchJson, type HazardSourceRow, type IngestResult } from "./types";

interface MetarJson {
  icaoId: string;
  rawOb: string;
  obsTime: number;
  reportTime?: string;
  temp?: number;
  dewp?: number;
  wdir?: number;
  wspd?: number;
  visib?: string | number;
  altim?: number;
  cover?: string;
  fltCat?: string;
}

interface TafJson {
  icaoId: string;
  rawTAF: string;
  issueTime?: string;
}

function parseVisib(v: string | number | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Math.round(v * 1.852 * 10) / 10;
  if (v === "6+") return 10;
  const n = parseFloat(v);
  return isNaN(n) ? null : Math.round(n * 1.852 * 10) / 10;
}

function roundOrNull(v: number | null | undefined): number | null {
  return v == null ? null : Math.round(v);
}

function intOrNull(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseInt(v, 10);
  return isNaN(n) ? null : n;
}

export async function ingestAwcMetar(
  _source: HazardSourceRow
): Promise<IngestResult> {
  const all = await db.select({ icao: airports.icao }).from(airports);
  if (all.length === 0) return { itemsNew: 0, itemsDupe: 0 };

  const ids = all.map((a) => a.icao).join(",");
  const headers = { "User-Agent": "WXWarning/1.0 (airport wx ingest)" };

  const [metars, tafs] = await Promise.all([
    fetchJson<MetarJson[]>(
      `https://aviationweather.gov/api/data/metar?ids=${ids}&format=json`
    ),
    fetchJson<TafJson[]>(
      `https://aviationweather.gov/api/data/taf?ids=${ids}&format=json`
    ).catch(() => [] as TafJson[]),
  ]);

  const tafByIcao = new Map(tafs.map((t) => [t.icaoId, t]));

  for (const m of metars) {
    if (!m.icaoId || !m.rawOb) continue;
    await db
      .insert(airportWx)
      .values({
        icao: m.icaoId,
        metarRaw: m.rawOb,
        metarObsAt: new Date(m.obsTime * 1000),
        fltCat: m.fltCat ?? null,
        tempC: roundOrNull(m.temp),
        dewpC: roundOrNull(m.dewp),
        windDir: intOrNull(m.wdir),
        windKt: intOrNull(m.wspd),
        visibKm: parseVisib(m.visib),
        altimHpa: roundOrNull(m.altim),
        cover: m.cover ?? null,
        tafRaw: tafByIcao.get(m.icaoId)?.rawTAF ?? null,
        tafIssuedAt: tafByIcao.get(m.icaoId)?.issueTime
          ? new Date(tafByIcao.get(m.icaoId)!.issueTime!)
          : null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: airportWx.icao,
        set: {
          metarRaw: m.rawOb,
          metarObsAt: new Date(m.obsTime * 1000),
          fltCat: m.fltCat ?? null,
          tempC: roundOrNull(m.temp),
          dewpC: roundOrNull(m.dewp),
          windDir: intOrNull(m.wdir),
          windKt: intOrNull(m.wspd),
          visibKm: parseVisib(m.visib),
          altimHpa: roundOrNull(m.altim),
          cover: m.cover ?? null,
          tafRaw: tafByIcao.get(m.icaoId)?.rawTAF ?? null,
          tafIssuedAt: tafByIcao.get(m.icaoId)?.issueTime
            ? new Date(tafByIcao.get(m.icaoId)!.issueTime!)
            : null,
          updatedAt: new Date(),
        },
      });
  }

  return { itemsNew: metars.length, itemsDupe: 0 };
}

import { createHash } from "node:crypto";
import { db } from "@/db";
import { earthquakes, hazards } from "@/db/schema";
import {
  fetchJson,
  quakeSeverity,
  type HazardSourceRow,
  type IngestResult,
} from "./types";

interface BmkgQuake {
  Tanggal: string;
  Jam: string;
  DateTime?: string;
  Coordinates?: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi: string;
}

function parseCoord(value: string, kind: "lat" | "lon"): number {
  const m = value.match(/^(-?\d+\.?\d*)\s*(LS|LU|BT|BB)?$/i);
  if (!m) return NaN;
  const num = parseFloat(m[1]);
  const dir = (m[2] ?? "").toUpperCase();
  if (kind === "lat") {
    return dir === "LS" ? -Math.abs(num) : num;
  }
  return dir === "BB" ? -Math.abs(num) : num;
}

function parseDepth(kedalaman: string): number {
  const m = kedalaman.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 10;
}

export async function ingestBmkgQuakes(
  source: HazardSourceRow
): Promise<IngestResult> {
  const data = await fetchJson<{ Infogempa: { gempa: BmkgQuake[] } }>(
    "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json"
  );

  let itemsNew = 0;
  let itemsDupe = 0;

  for (const q of data.Infogempa.gempa) {
    const mag = parseFloat(q.Magnitude);
    if (Number.isNaN(mag) || mag < 5.0) continue;

    const canonicalHash = createHash("sha256")
      .update(`BMKG:quake:${q.DateTime ?? `${q.Tanggal}${q.Jam}`}`)
      .digest("hex");

    const latLon = q.Coordinates?.split(",").map(parseFloat);
    const lat = latLon && latLon.length === 2 ? latLon[0] : parseCoord(q.Lintang, "lat");
    const lon = latLon && latLon.length === 2 ? latLon[1] : parseCoord(q.Bujur, "lon");
    const occurredAt = q.DateTime
      ? new Date(q.DateTime)
      : new Date();

    const inserted = await db
      .insert(hazards)
      .values({
        sourceId: source.id,
        type: "quake",
        severity: quakeSeverity(mag),
        title: `M${mag.toFixed(1)} · ${q.Wilayah}`,
        areaText: q.Wilayah,
        validFrom: occurredAt,
        validUntil: new Date(occurredAt.getTime() + 60 * 60 * 1000),
        canonicalHash,
        rawPayload: q as unknown as Record<string, unknown>,
        status: "ACTIVE",
      })
      .onConflictDoNothing({ target: hazards.canonicalHash })
      .returning({ id: hazards.id });

    if (inserted.length === 0) {
      itemsDupe++;
      continue;
    }

    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      await db.insert(earthquakes).values({
        hazardId: inserted[0].id,
        magnitude: mag,
        depthKm: parseDepth(q.Kedalaman),
        lat,
        lon,
        place: q.Wilayah,
        occurredAt,
        tsunamiFlag: /potensi/i.test(q.Potensi ?? ""),
        sourceName: "BMKG",
      });
    }

    itemsNew++;
  }

  return { itemsNew, itemsDupe };
}

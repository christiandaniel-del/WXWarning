import { createHash } from "node:crypto";
import { db } from "@/db";
import { earthquakes, hazards } from "@/db/schema";
import {
  fetchJson,
  quakeSeverity,
  type HazardSourceRow,
  type IngestResult,
} from "./types";

interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    tsunami: number;
    title: string;
  };
  geometry: { coordinates: [number, number, number] };
}

export async function ingestUsgsQuakes(
  source: HazardSourceRow
): Promise<IngestResult> {
  const data = await fetchJson<{ features: UsgsFeature[] }>(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson"
  );

  let itemsNew = 0;
  let itemsDupe = 0;

  for (const f of data.features) {
    if (f.properties.mag == null || f.properties.mag < 5.5) continue;

    const canonicalHash = createHash("sha256")
      .update(`USGS:quake:${f.id}`)
      .digest("hex");

    const occurredAt = new Date(f.properties.time);
    const [lon, lat, depthKm] = f.geometry.coordinates;

    const inserted = await db
      .insert(hazards)
      .values({
        sourceId: source.id,
        type: "quake",
        severity: quakeSeverity(f.properties.mag),
        title: f.properties.title,
        areaText: f.properties.place,
        validFrom: occurredAt,
        validUntil: new Date(occurredAt.getTime() + 60 * 60 * 1000),
        canonicalHash,
        rawPayload: f as unknown as Record<string, unknown>,
        status: "ACTIVE",
      })
      .onConflictDoNothing({ target: hazards.canonicalHash })
      .returning({ id: hazards.id });

    if (inserted.length === 0) {
      itemsDupe++;
      continue;
    }

    await db.insert(earthquakes).values({
      hazardId: inserted[0].id,
      magnitude: f.properties.mag,
      depthKm,
      lat,
      lon,
      place: f.properties.place ?? "unknown",
      occurredAt,
      tsunamiFlag: f.properties.tsunami === 1,
      sourceName: "USGS",
    });

    itemsNew++;
  }

  return { itemsNew, itemsDupe };
}

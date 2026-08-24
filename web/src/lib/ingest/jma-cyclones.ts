import { createHash } from "node:crypto";
import { db } from "@/db";
import { cyclones, cyclonePoints, hazards } from "@/db/schema";
import { fetchJson, type HazardSourceRow, type IngestResult } from "./types";

interface TargetTc {
  tropicalCyclone: string;
  typhoonNumber: string;
  category: string;
  issue: string;
}

interface SpecEntry {
  part: string | { jp?: string; en?: string };
  issue?: { UTC?: string };
  typhoonNumber?: string;
  name?: { en?: string };
  category?: { en?: string };
  advancedHours?: number;
  maximumWind?: { sustained?: { kt?: string }; gust?: { kt?: string } };
  pressure?: string;
  position?: { deg?: [number, number] };
  probabilityCircleRadius?: { km?: number };
  validtime?: { UTC?: string };
}

function partEn(part: SpecEntry["part"]): string {
  if (typeof part === "string") return part;
  return part.en ?? "";
}

function mapCategory(cat: string, windKt: number) {
  switch (cat) {
    case "TD":
      return "TD" as const;
    case "TS":
      return "TS" as const;
    case "STS":
      return "STS" as const;
    case "TY":
      if (windKt >= 137) return "TY_C5" as const;
      if (windKt >= 113) return "TY_C4" as const;
      if (windKt >= 96) return "TY_C3" as const;
      if (windKt >= 83) return "TY_C2" as const;
      return "TY_C1" as const;
    default:
      return "TD" as const;
  }
}

function severityFor(cat: string, windKt: number) {
  if (cat === "TY" && windKt >= 96) return "extreme" as const;
  if (cat === "TY" || cat === "STS") return "severe" as const;
  if (cat === "TS") return "moderate" as const;
  return "info" as const;
}

const BASE = "https://www.jma.go.jp/bosai/typhoon/data";

export async function ingestJmaCyclones(
  source: HazardSourceRow
): Promise<IngestResult> {
  const targets = await fetchJson<TargetTc[]>(`${BASE}/targetTc.json`);
  let itemsNew = 0;
  let itemsDupe = 0;

  for (const tc of targets) {
    const specs = await fetchJson<SpecEntry[]>(
      `${BASE}/${tc.tropicalCyclone}/specifications.json`
    );

    const titleEntry = specs.find((s) => partEn(s.part) === "title");
    const name = titleEntry?.name?.en ?? tc.tropicalCyclone;
    const typhoonNumber = titleEntry?.typhoonNumber ?? tc.typhoonNumber;
    const issueUtc = titleEntry?.issue?.UTC ?? new Date().toISOString();

    const analysis = specs.find(
      (s) => partEn(s.part) === "Analysis" || s.advancedHours === 0
    );

    const windKt = parseInt(analysis?.maximumWind?.sustained?.kt ?? "0", 10);
    const cat = analysis?.category?.en ?? tc.category ?? "TD";
    const dbCategory = mapCategory(cat, windKt);

    const canonicalHash = createHash("sha256")
      .update(`JMA:cyclone:${typhoonNumber}:${issueUtc}`)
      .digest("hex");

    const validFrom = analysis?.validtime?.UTC
      ? new Date(analysis.validtime.UTC)
      : new Date(issueUtc);

    const inserted = await db
      .insert(hazards)
      .values({
        sourceId: source.id,
        type: "cyclone",
        severity: severityFor(cat, windKt),
        title: `${cat} ${typhoonNumber} ${name} · ${windKt}kt G${
          analysis?.maximumWind?.gust?.kt ?? "?"
        } · ${analysis?.pressure ?? "?"}hPa`,
        areaText: "Western North Pacific",
        geom: null,
        validFrom,
        validUntil: new Date(validFrom.getTime() + 12 * 60 * 60 * 1000),
        canonicalHash,
        rawPayload: specs as unknown as Record<string, unknown>,
        status: "ACTIVE",
      })
      .onConflictDoNothing({ target: hazards.canonicalHash })
      .returning({ id: hazards.id });

    if (inserted.length === 0) {
      itemsDupe++;
      continue;
    }

    const [cycloneRow] = await db
      .insert(cyclones)
      .values({
        hazardId: inserted[0].id,
        name,
        internationalDesignator: typhoonNumber,
        basin: "WPAC",
        category: dbCategory,
      })
      .returning({ id: cyclones.id });

    const points = specs.filter(
      (s) =>
        s.position?.deg &&
        (partEn(s.part) === "Analysis" || (s.advancedHours ?? 0) > 0)
    );

    for (const p of points) {
      const deg = p.position?.deg;
      if (!deg || deg.length < 2) continue;
      const [lat, lon] = deg;
      await db.insert(cyclonePoints).values({
        cycloneId: cycloneRow.id,
        validTime: p.validtime?.UTC
          ? new Date(p.validtime.UTC)
          : validFrom,
        isForecast: (p.advancedHours ?? 0) > 0,
        lat,
        lon,
        maxWindKt: parseInt(p.maximumWind?.sustained?.kt ?? "0", 10) || null,
        gustKt: parseInt(p.maximumWind?.gust?.kt ?? "0", 10) || null,
        pressureHpa: p.pressure ? parseInt(p.pressure, 10) : null,
        uncertaintyRadiusKm: p.probabilityCircleRadius?.km ?? null,
      });
    }

    itemsNew++;
  }

  return { itemsNew, itemsDupe };
}

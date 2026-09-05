import { createHash } from "node:crypto";
import { db } from "@/db";
import { cyclones, cyclonePoints, hazards } from "@/db/schema";
import type { HazardSourceRow, IngestResult } from "./types";

const RSS_URL = "https://metoc.ndbc.noaa.gov/RSSFeeds-portlet/img/jtwc/jtwc.rss";

function parseTcw(text: string) {
  const lines = text.split(/\r?\n/);
  const header = lines[0] ?? "";
  const match = header.match(/WT\w+\s+\w+\s+(\d{6})\s+([A-Z]{2}\d{2})\s+\w+\s+(\d{3})/);
  if (!match) return null;
  const issued = match[1];
  const id = match[2];
  const num = match[3];
  const tline = lines.find(l => l.startsWith("T000"));
  if (!tline) return null;
  const parts = tline.trim().split(/\s+/);
  const latStr = parts[1] ?? "";
  const lonStr = parts[2] ?? "";
  const wind = parseInt(parts[3] ?? "0", 10);
  const lat = parseFloat(latStr.replace(/[NS]/, "")) * 0.1 * (latStr.includes("S") ? -1 : 1);
  const lon = parseFloat(lonStr.replace(/[EW]/, "")) * 0.1 * (lonStr.includes("W") ? -1 : 1);
  return { id, num, issued, lat, lon, wind };
}

export async function ingestJtwcCyclones(source: HazardSourceRow): Promise<IngestResult> {
  let itemsNew = 0;
  let itemsDupe = 0;
  try {
    const rssRes = await fetch(RSS_URL, { signal: AbortSignal.timeout(15_000) });
    const rss = await rssRes.text();
    const tcwUrls = [...rss.matchAll(/https?:\/\/[^"'\s]+\.tcw/g)].map(m => m[0]);
    const uniqueUrls = Array.from(new Set(tcwUrls)).slice(0, 20);
    for (const url of uniqueUrls) {
      try {
        const tcwRes = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        const tcw = await tcwRes.text();
        const parsed = parseTcw(tcw);
        if (!parsed) { itemsDupe++; continue; }
        const canonicalHash = createHash("sha256")
          .update(`JTWC:cyclone:${parsed.id}:${parsed.issued}`)
          .digest("hex");
        const validFrom = new Date(`${parsed.issued.slice(0,4)}-${parsed.issued.slice(4,6)}-${parsed.issued.slice(6,8)}T${parsed.issued.slice(8,10)}:00:00Z`);
        const inserted = await db.insert(hazards).values({
          sourceId: source.id,
          type: "cyclone",
          severity: parsed.wind >= 96 ? "extreme" : parsed.wind >= 64 ? "severe" : "moderate",
          title: `JTWC ${parsed.id} ${parsed.num} · ${parsed.wind}kt`,
          areaText: "Western North Pacific",
          geom: null,
          validFrom,
          validUntil: new Date(validFrom.getTime() + 12*60*60*1000),
          canonicalHash,
          rawPayload: { url, parsed } as unknown as Record<string, unknown>,
          status: "ACTIVE",
        }).onConflictDoNothing({ target: hazards.canonicalHash }).returning({ id: hazards.id });
        if (inserted.length === 0) { itemsDupe++; continue; }
        await db.insert(cyclones).values({
          hazardId: inserted[0].id,
          name: parsed.id,
          internationalDesignator: parsed.num,
          basin: "WPAC",
          category: "TY_C1",
        });
        await db.insert(cyclonePoints).values({
          cycloneId: inserted[0].id,
          validTime: validFrom,
          isForecast: false,
          lat: parsed.lat,
          lon: parsed.lon,
          maxWindKt: parsed.wind,
          gustKt: null,
          pressureHpa: null,
          uncertaintyRadiusKm: null,
        });
        itemsNew++;
      } catch { itemsDupe++; }
    }
  } catch { }
  return { itemsNew, itemsDupe };
}

import { createHash } from "node:crypto";
import { db } from "@/db";
import { hazards } from "@/db/schema";
import type { HazardSourceRow, IngestResult } from "./types";

const FEED_URL = "https://www.ssd.noaa.gov/PS/TROP/DATA/ATCF/VAAC/tokyo.txt";

export async function ingestVaacTokyo(source: HazardSourceRow): Promise<IngestResult> {
  let itemsNew = 0;
  let itemsDupe = 0;
  try {
    const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(15_000) });
    const txt = await res.text();
    const lines = txt.split(/\r?\n/).filter(l => l.trim());
    for (const line of lines.slice(0, 10)) {
      const hash = createHash("sha256").update(`VAAC_TOKYO:${line}`).digest("hex");
      const inserted = await db.insert(hazards).values({
        sourceId: source.id,
        type: "ash",
        severity: "moderate",
        title: `VAAC Tokyo ash advisory`,
        areaText: "Western Pacific",
        geom: null,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 6*60*60*1000),
        canonicalHash: hash,
        rawPayload: { line } as unknown as Record<string, unknown>,
        status: "ACTIVE",
      }).onConflictDoNothing({ target: hazards.canonicalHash }).returning({ id: hazards.id });
      if (inserted.length) itemsNew++; else itemsDupe++;
    }
  } catch { }
  return { itemsNew, itemsDupe };
}

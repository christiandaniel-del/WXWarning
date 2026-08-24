import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { hazardSources, ingestLogs } from "@/db/schema";
import type { HazardSourceRow, IngestAdapter, IngestResult } from "./types";
import { ingestUsgsQuakes } from "./usgs-quakes";
import { ingestBmkgQuakes } from "./bmkg-quakes";
import { ingestJmaCyclones } from "./jma-cyclones";
import { ingestMagmaVolcanoes } from "./magma-volcanoes";
import { ingestVaacDarwin } from "./vaac-darwin";
import { ingestAwcMetar } from "./awc-metar";

const ADAPTERS: Record<string, IngestAdapter> = {
  USGS: ingestUsgsQuakes,
  BMKG: ingestBmkgQuakes,
  PVMBG_MAGMA: ingestMagmaVolcanoes,
  JMA: ingestJmaCyclones,
  VAAC_DARWIN: ingestVaacDarwin,
  AWC_METAR: ingestAwcMetar,
};

export async function runIngest(sourceName?: string) {
  const enabled = await db
    .select()
    .from(hazardSources)
    .where(eq(hazardSources.enabled, true));

  const targets = sourceName
    ? enabled.filter((s) => s.name === sourceName)
    : enabled;

  const results: Array<{ source: string; result: IngestResult }> = [];

  for (const source of targets as HazardSourceRow[]) {
    const started = Date.now();
    const adapter = ADAPTERS[source.name];
    let result: IngestResult;

    if (!adapter) {
      result = { itemsNew: 0, itemsDupe: 0, error: "adapter not implemented" };
    } else {
      try {
        result = await adapter(source);
      } catch (e) {
        result = {
          itemsNew: 0,
          itemsDupe: 0,
          error: e instanceof Error ? e.message : "unknown error",
        };
      }
    }

    await db.insert(ingestLogs).values({
      sourceId: source.id,
      startedAt: new Date(started),
      durationMs: Date.now() - started,
      itemsNew: result.itemsNew,
      itemsDupe: result.itemsDupe,
      error: result.error ?? null,
    });

    if (!result.error) {
      await db
        .update(hazardSources)
        .set({ lastSuccessAt: new Date() })
        .where(inArray(hazardSources.id, [source.id]));
    }

    results.push({ source: source.name, result });
  }

  return results;
}

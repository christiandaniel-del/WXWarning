import type { InferInsertModel } from "drizzle-orm";
import type { earthquakes, hazards } from "@/db/schema";

export interface HazardSourceRow {
  id: string;
  name: string;
  url: string;
  pollIntervalS: number;
  stalenessThresholdS: number;
  enabled: boolean;
  lastSuccessAt: Date | null;
}

export interface IngestResult {
  itemsNew: number;
  itemsDupe: number;
  error?: string;
}

export type IngestAdapter = (source: HazardSourceRow) => Promise<IngestResult>;

export type NewHazard = InferInsertModel<typeof hazards>;
export type NewEarthquake = InferInsertModel<typeof earthquakes>;

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": "WXWarning/1.0 (hazard ingest)" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.json() as Promise<T>;
}

export function quakeSeverity(mag: number) {
  if (mag >= 7) return "extreme" as const;
  if (mag >= 6.5) return "severe" as const;
  return "moderate" as const;
}

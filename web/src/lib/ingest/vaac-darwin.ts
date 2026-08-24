import { createHash } from "node:crypto";
import { db } from "@/db";
import { hazards } from "@/db/schema";
import type { HazardSourceRow, IngestResult } from "./types";

const ENDPOINT = "https://www.bom.gov.au/aviation/php/process.php";

interface DarwinAdvisory {
  text: string;
  graphic?: string;
  isBackup?: boolean;
  name?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function coordToDecimal(hemi: string, value: string): number {
  const deg = parseInt(value.slice(0, value.length > 4 ? 3 : 2), 10);
  const min = parseInt(value.slice(value.length > 4 ? 3 : 2), 10);
  const dec = deg + min / 60;
  return hemi === "S" || hemi === "W" ? -dec : dec;
}

function parseDtg(value: string): Date {
  const m = value.match(/(\d{8})\/(\d{4})Z/);
  if (!m) return new Date();
  return new Date(
    `${m[1].slice(0, 4)}-${m[1].slice(4, 6)}-${m[1].slice(6, 8)}T${m[2].slice(0, 2)}:${m[2].slice(2, 4)}:00Z`
  );
}

interface CloudSection {
  kind: "obs" | "fcst";
  hoursAhead: number;
  topFl: number | null;
  points: Array<[number, number]>;
}

function parseCloudSections(text: string): CloudSection[] {
  const sections = text.split(
    /(?=(?:OBS|EST) VA DTG:|(?:OBS|EST) VA CLD:|FCST VA CLD|RMK:|NXT ADVISORY:)/
  );
  const out: CloudSection[] = [];

  for (const sec of sections) {
    const cl = sec.match(/^(OBS|EST) VA CLD:|^(FCST) VA CLD \+(\d+) HR:/);
    if (!cl) continue;

    const kind = cl[1] ? "obs" : "fcst";
    const hoursAhead = cl[3] ? parseInt(cl[3], 10) : 0;

    const flMatch = sec.match(/FL(\d{3})/);
    const topFl = flMatch ? parseInt(flMatch[1], 10) : null;

    const points: Array<[number, number]> = [];
    const coordRe = /([NS])(\d{4})\s+([EW])(\d{5})/g;
    let cm: RegExpExecArray | null;
    while ((cm = coordRe.exec(sec)) !== null) {
      points.push([
        coordToDecimal(cm[1], cm[2]),
        coordToDecimal(cm[3], cm[4]),
      ]);
    }

    if (points.length >= 3) {
      out.push({ kind, hoursAhead, topFl, points });
    }
  }
  return out;
}

export async function ingestVaacDarwin(
  source: HazardSourceRow
): Promise<IngestResult> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: {
      "User-Agent": "Mozilla/5.0 (WXWarning/1.0 hazard ingest)",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "page=volcanic-ash-darwin&javascript=1",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${ENDPOINT}`);

  const data = (await res.json()) as {
    total: number;
    advisories: Record<string, DarwinAdvisory>;
  };

  let itemsNew = 0;
  let itemsDupe = 0;

  for (const adv of Object.values(data.advisories ?? {})) {
    if (adv.isBackup) continue;
    const text = stripHtml(adv.text ?? "");
    if (!text.includes("VA ADVISORY")) continue;

    const dtgMatch = text.match(/DTG:\s*(\d{8}\/\d{4}Z)/);
    const volMatch = text.match(/VOLCANO:\s*([A-Z][A-Z \-']+?)\s+(\d{6})/);
    const nrMatch = text.match(/ADVISORY NR:\s*(\d{4}\/\d+)/);
    const psnMatch = text.match(/PSN:\s*([NS])(\d{4})\s+([EW])(\d{5})/);
    const areaMatch = text.match(/AREA:\s*(.+)/);

    if (!dtgMatch || !volMatch || !nrMatch) continue;

    const volcanoName = volMatch[1].trim();
    const siNumber = volMatch[2];
    const advisoryNr = nrMatch[1];
    const dtg = parseDtg(dtgMatch[1]);

    const clouds = parseCloudSections(text);
    const obs = clouds.find((c) => c.kind === "obs") ?? clouds[0];
    const topFl = obs?.topFl ?? 0;

    const severity =
      topFl >= 250 ? "extreme" : topFl >= 150 ? "severe" : "moderate";

    const geom =
      obs && obs.points.length >= 3
        ? {
            type: "Polygon",
            coordinates: [
              [...obs.points.map(([lat, lon]) => [lon, lat]), [obs.points[0][1], obs.points[0][0]]],
            ],
          }
        : null;

    const canonicalHash = createHash("sha256")
      .update(`VAAC_DARWIN:ash:${siNumber}:${advisoryNr}`)
      .digest("hex");

    const inserted = await db
      .insert(hazards)
      .values({
        sourceId: source.id,
        type: "ash",
        severity,
        title: `VA ADVISORY ${volcanoName} · ${obs ? `SFC/FL${String(topFl).padStart(3, "0")}` : "no VA obs"} · ADV ${advisoryNr}`,
        areaText: `${areaMatch?.[1]?.trim() ?? "Indonesia"} · ${volcanoName} ${siNumber}`,
        geom,
        validFrom: dtg,
        validUntil: new Date(dtg.getTime() + 24 * 60 * 60 * 1000),
        canonicalHash,
        rawPayload: {
          text,
          graphic: adv.graphic ?? null,
          clouds,
          psn: psnMatch
            ? {
                lat: coordToDecimal(psnMatch[1], psnMatch[2]),
                lon: coordToDecimal(psnMatch[3], psnMatch[4]),
              }
            : null,
        },
        status: "ACTIVE",
      })
      .onConflictDoNothing({ target: hazards.canonicalHash })
      .returning({ id: hazards.id });

    if (inserted.length === 0) {
      itemsDupe++;
    } else {
      itemsNew++;
    }
  }

  return { itemsNew, itemsDupe };
}

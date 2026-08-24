import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { hazards, volcanoes } from "@/db/schema";
import type { HazardSourceRow, IngestResult } from "./types";

const SOURCE_URL =
  "https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas";

const COORDS: Record<string, [number, number]> = {
  "ANAK KRAKATAU": [-6.102, 105.423],
  "LEWOTOBI LAKI-LAKI": [-8.542, 122.775],
  MERAPI: [-7.541, 110.446],
  SEMERU: [-8.108, 112.922],
  AWU: [3.672, 125.502],
  "BANDA API": [-5.528, 129.874],
  BROMO: [-7.942, 112.95],
  "BUR NI TELONG": [4.787, 96.818],
  DEMPO: [-4.033, 103.124],
  DUKONO: [1.693, 127.878],
  GAMALAMA: [0.797, 127.327],
  IBU: [1.488, 127.631],
  "ILI LEWOTOLOK": [-8.274, 123.508],
  IYA: [-8.392, 121.645],
  KARANGETANG: [2.781, 125.402],
  KERINCI: [-1.697, 101.264],
  LOKON: [1.358, 124.792],
  MARAPI: [-0.382, 100.474],
  RAUNG: [-8.119, 114.042],
  RINJANI: [-8.417, 116.465],
  SANGEANGAPI: [-8.2, 119.075],
  SINABUNG: [3.17, 98.392],
  SLAMET: [-7.242, 109.208],
  SOPUTAN: [1.109, 124.731],
  SORIKMARAPI: [0.686, 99.538],
  TAMBORA: [-8.247, 118.0],
  AGUNG: [-8.343, 115.508],
  AMBANG: [0.998, 124.748],
  "ANAK RANAKAH": [-8.475, 120.538],
  "ARJUNO WELIRANG": [-7.725, 112.58],
  BATUR: [-8.242, 115.375],
  BATUTARA: [-8.222, 123.492],
  CIREMAI: [-6.893, 108.397],
  COLO: [0.173, 121.605],
  DIENG: [-7.201, 109.862],
  EBULOBO: [-8.817, 121.175],
  EGON: [-8.672, 122.462],
  GALUNGGUNG: [-7.25, 108.058],
  GAMKONORA: [1.375, 127.528],
  GEDE: [-6.772, 106.977],
  GUNTUR: [-7.152, 107.288],
  HOBAL: [-8.75, 122.032],
  IJEN: [-8.058, 114.242],
  "ILE WERUNG": [-8.508, 123.572],
  "ILI BOLENG": [-8.308, 123.128],
  INIELIKA: [-8.883, 120.992],
  INIERIE: [-8.878, 121.337],
  KABA: [-3.517, 102.625],
  KELIMUTU: [-8.775, 121.608],
  KELUD: [-7.93, 112.308],
  "KIE BESI": [2.088, 128.032],
  LAMONGAN: [-7.978, 112.348],
  LEREBOLENG: [-8.37, 122.808],
  "LEWOTOBI PEREMPUAN": [-8.53, 122.76],
  MAHAWU: [1.358, 124.858],
  PAPANDAYAN: [-7.317, 107.733],
  "PEUT SAGUE": [4.912, 96.328],
  ROKATENDA: [-8.517, 121.708],
  RUANG: [2.297, 125.372],
  SALAK: [-6.72, 106.732],
  "SEULAWAH AGAM": [5.448, 95.658],
  SIRUNG: [-8.517, 123.578],
  SUMBING: [-7.388, 110.062],
  SUNDORO: [-7.315, 109.992],
  TALANG: [-0.978, 100.678],
  TANDIKAT: [-0.828, 100.428],
  TANGKOKO: [1.523, 125.205],
  "TANGKUBAN PARAHU": [-6.772, 107.6],
  WURLALI: [-7.798, 128.708],
};

type Level = "AWAS" | "SIAGA" | "WASPADA" | "NORMAL";
type ColorCode = "RED" | "ORANGE" | "YELLOW" | "GREEN";

const LEVEL_MAP: Record<Level, ColorCode> = {
  AWAS: "RED",
  SIAGA: "ORANGE",
  WASPADA: "YELLOW",
  NORMAL: "GREEN",
};

const SEVERITY: Record<ColorCode, "extreme" | "severe" | "moderate" | "info"> = {
  RED: "extreme",
  ORANGE: "severe",
  YELLOW: "moderate",
  GREEN: "info",
};

interface ParsedVolcano {
  name: string;
  province: string;
  level: Level;
}

async function fetchPage(): Promise<string> {
  const res = await fetch(SOURCE_URL, {
    signal: AbortSignal.timeout(20_000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${SOURCE_URL}`);
  return res.text();
}

function parseVolcanoes(html: string): ParsedVolcano[] {
  const results: ParsedVolcano[] = [];
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? [];
  let currentLevel: Level | null = null;

  for (const row of rows) {
    const text = row
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const levelMatch = text.match(/Level (IV|III|II|I)\s*\((AWAS|SIAGA|WASPADA|NORMAL)\)/i);
    if (levelMatch) {
      currentLevel = levelMatch[2].toUpperCase() as Level;
      continue;
    }

    const volMatch = text.match(/^([A-Z][A-Za-z' \-]+?) - (.+?) Lihat laporan/);
    if (volMatch && currentLevel) {
      results.push({
        name: volMatch[1].trim(),
        province: volMatch[2].trim(),
        level: currentLevel,
      });
    }
  }
  return results;
}

export async function ingestMagmaVolcanoes(
  source: HazardSourceRow
): Promise<IngestResult> {
  const html = await fetchPage();
  const list = parseVolcanoes(html);

  if (list.length === 0) {
    throw new Error("parse menghasilkan 0 gunung — struktur halaman berubah?");
  }

  let itemsNew = 0;
  let itemsDupe = 0;
  const now = new Date();

  for (const v of list) {
    const colorCode = LEVEL_MAP[v.level];
    const coords = COORDS[v.name.toUpperCase()];

    await db
      .insert(volcanoes)
      .values({
        name: v.name,
        country: "ID",
        lat: coords?.[0] ?? 0,
        lon: coords?.[1] ?? 0,
        colorCode,
        codeUpdatedAt: now,
      })
      .onConflictDoUpdate({
        target: volcanoes.name,
        set: { colorCode, codeUpdatedAt: now, lat: coords?.[0] ?? 0, lon: coords?.[1] ?? 0 },
      });

    if (v.level === "NORMAL" || !coords) continue;

    const canonicalHash = createHash("sha256")
      .update(`PVMBG:volcano:${v.name}:${v.level}`)
      .digest("hex");

    const inserted = await db
      .insert(hazards)
      .values({
        sourceId: source.id,
        type: "volcano",
        severity: SEVERITY[colorCode],
        title: `${v.name} · Level aktivitas ${v.level} (color code ${colorCode})`,
        areaText: v.province,
        validFrom: now,
        validUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        canonicalHash,
        rawPayload: { name: v.name, province: v.province, level: v.level },
        status: "ACTIVE",
      })
      .onConflictDoNothing({ target: hazards.canonicalHash })
      .returning({ id: hazards.id });

    if (inserted.length === 0) {
      itemsDupe++;
    } else {
      await db
        .update(volcanoes)
        .set({ hazardId: inserted[0].id })
        .where(eq(volcanoes.name, v.name));
      itemsNew++;
    }
  }

  return { itemsNew, itemsDupe };
}

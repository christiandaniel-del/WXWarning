import { NextResponse } from "next/server";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { hazards } from "@/db/schema";

const SEVERITIES = ["info", "moderate", "severe", "extreme"] as const;
const TYPES = ["sigmet", "metar_alert", "cyclone", "volcano", "quake", "ash"] as const;

type HazardTypeValue = (typeof hazards.type.enumValues)[number];
type SeverityValue = (typeof hazards.severity.enumValues)[number];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active") !== "false";
  const type = searchParams.get("type");
  const severity = searchParams.get("severity");

  const conditions: SQL[] = [];
  if (active) conditions.push(eq(hazards.status, "ACTIVE"));
  if (type && (TYPES as readonly string[]).includes(type)) {
    conditions.push(eq(hazards.type, type as HazardTypeValue));
  }
  if (severity && (SEVERITIES as readonly string[]).includes(severity)) {
    conditions.push(eq(hazards.severity, severity as SeverityValue));
  }

  const rows = await db
    .select()
    .from(hazards)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(hazards.createdAt))
    .limit(100);

  return NextResponse.json(
    {
      data: rows.map((h) => ({
        id: h.id,
        type: h.type,
        severity: h.severity,
        title: h.title,
        area_text: h.areaText,
        valid_from: h.validFrom,
        valid_until: h.validUntil,
        status: h.status,
        acknowledged_by_me: false,
        source_name: "ingest",
        fetched_at: h.createdAt,
      })),
      meta: {
        next_cursor: null,
        server_time: new Date().toISOString(),
        count: rows.length,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

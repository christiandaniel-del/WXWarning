import { NextResponse } from "next/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { hazards } from "@/db/schema";

export async function GET() {
  const rows = await db
    .select({
      id: hazards.id,
      title: hazards.title,
      areaText: hazards.areaText,
      severity: hazards.severity,
      geom: hazards.geom,
      validFrom: hazards.validFrom,
      validUntil: hazards.validUntil,
    })
    .from(hazards)
    .where(
      and(
        eq(hazards.type, "ash"),
        eq(hazards.status, "ACTIVE"),
        gt(hazards.validUntil, new Date())
      )
    )
    .orderBy(desc(hazards.createdAt));

  return NextResponse.json(
    {
      data: rows.filter((r) => r.geom),
      meta: { count: rows.length, server_time: new Date().toISOString() },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

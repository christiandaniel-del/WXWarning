import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cyclonePoints, cyclones, hazards } from "@/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active") !== "false";

  const rows = await db
    .select({
      id: cyclones.id,
      hazardId: cyclones.hazardId,
      name: cyclones.name,
      designator: cyclones.internationalDesignator,
      basin: cyclones.basin,
      category: cyclones.category,
      hazardStatus: hazards.status,
      validUntil: hazards.validUntil,
    })
    .from(cyclones)
    .innerJoin(hazards, eq(cyclones.hazardId, hazards.id))
    .where(active ? eq(hazards.status, "ACTIVE") : undefined);

  const data = [];
  for (const row of rows) {
    const track = await db
      .select()
      .from(cyclonePoints)
      .where(eq(cyclonePoints.cycloneId, row.id))
      .orderBy(asc(cyclonePoints.validTime));
    data.push({ ...row, track });
  }

  return NextResponse.json(
    { data, meta: { count: data.length, server_time: new Date().toISOString() } },
    { headers: { "Cache-Control": "no-store" } }
  );
}

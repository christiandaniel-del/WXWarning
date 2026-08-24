import { NextResponse } from "next/server";
import { desc, gte, and, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { earthquakes } from "@/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minMag = parseFloat(searchParams.get("min_mag") ?? "5.5");
  const since = searchParams.get("since");

  const conditions: SQL[] = [gte(earthquakes.magnitude, isNaN(minMag) ? 5.5 : minMag)];
  if (since) {
    const d = new Date(since);
    if (!isNaN(d.getTime())) conditions.push(gte(earthquakes.occurredAt, d));
  }

  const rows = await db
    .select()
    .from(earthquakes)
    .where(and(...conditions))
    .orderBy(desc(earthquakes.occurredAt))
    .limit(100);

  return NextResponse.json(
    { data: rows, meta: { count: rows.length, server_time: new Date().toISOString() } },
    { headers: { "Cache-Control": "no-store" } }
  );
}

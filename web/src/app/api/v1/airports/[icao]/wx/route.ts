import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { airports, airportWx } from "@/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ icao: string }> }
) {
  const { icao } = await params;

  const [airport] = await db
    .select()
    .from(airports)
    .where(eq(airports.icao, icao.toUpperCase()));
  if (!airport) {
    return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  }

  const [wx] = await db
    .select()
    .from(airportWx)
    .where(eq(airportWx.icao, airport.icao));

  return NextResponse.json(
    { airport, wx: wx ?? null, stale: wx ? Date.now() - wx.updatedAt.getTime() > 90 * 60 * 1000 : true },
    { headers: { "Cache-Control": "no-store" } }
  );
}

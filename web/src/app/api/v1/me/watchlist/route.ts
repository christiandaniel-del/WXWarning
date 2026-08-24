import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { airports, watchlists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: "NO_USER" }, { status: 500 });
  }

  const items = await db
    .select({
      id: watchlists.id,
      type: watchlists.type,
      icao: watchlists.icao,
      centerLat: watchlists.centerLat,
      centerLon: watchlists.centerLon,
      radiusKm: watchlists.radiusKm,
    })
    .from(watchlists)
    .where(eq(watchlists.userId, user.id));

  return NextResponse.json({ data: items });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: "NO_USER" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.type) {
    return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (body.type === "airport") {
    if (typeof body.icao !== "string" || !/^[A-Z]{4}$/.test(body.icao)) {
      return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 400 });
    }
    const [ap] = await db.select().from(airports).where(eq(airports.icao, body.icao));
    if (!ap) {
      return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    }
    const [item] = await db
      .insert(watchlists)
      .values({ userId: user.id, type: "airport", icao: body.icao })
      .returning();
    return NextResponse.json({ data: item }, { status: 201 });
  }

  if (body.type === "area") {
    const { centerLat, centerLon, radiusKm } = body;
    if (
      typeof centerLat !== "number" ||
      typeof centerLon !== "number" ||
      typeof radiusKm !== "number" ||
      radiusKm < 10 ||
      radiusKm > 2000
    ) {
      return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 400 });
    }
    const [item] = await db
      .insert(watchlists)
      .values({ userId: user.id, type: "area", centerLat, centerLon, radiusKm })
      .returning();
    return NextResponse.json({ data: item }, { status: 201 });
  }

  return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 400 });
}

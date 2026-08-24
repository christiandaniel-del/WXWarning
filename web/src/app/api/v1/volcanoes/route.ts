import { NextResponse } from "next/server";
import { desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { volcanoes } from "@/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  const rows = await db
    .select()
    .from(volcanoes)
    .where(activeOnly ? ne(volcanoes.colorCode, "GREEN") : undefined)
    .orderBy(desc(volcanoes.codeUpdatedAt));

  return NextResponse.json(
    { data: rows, meta: { count: rows.length, server_time: new Date().toISOString() } },
    { headers: { "Cache-Control": "no-store" } }
  );
}

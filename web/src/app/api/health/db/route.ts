import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { hazardSources } from "@/db/schema";

export async function GET() {
  try {
    const started = Date.now();
    const sources = await db
      .select({
        name: hazardSources.name,
        enabled: hazardSources.enabled,
        lastSuccessAt: hazardSources.lastSuccessAt,
      })
      .from(hazardSources);
    const version = await db.execute<{ version: string }>(
      sql`SELECT version()`
    );
    const pgVersion = version[0]?.version ?? "unknown";

    return NextResponse.json({
      status: "ok",
      latency_ms: Date.now() - started,
      postgres: pgVersion.split(" ").slice(0, 2).join(" "),
      sources,
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        message: e instanceof Error ? e.message : "unknown error",
      },
      { status: 500 }
    );
  }
}

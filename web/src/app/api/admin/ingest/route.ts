import { NextResponse } from "next/server";
import { runIngest } from "@/lib/ingest/runner";

async function handle(request: Request) {
  const secret = process.env.INGEST_SECRET;
  if (secret && request.headers.get("x-ingest-secret") !== secret) {
    return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") ?? undefined;

  const started = Date.now();
  const results = await runIngest(source);

  return NextResponse.json({
    status: "ok",
    duration_ms: Date.now() - started,
    results,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    {
      code: "NOT_FOUND",
      message: `Mock API: detail untuk ${id} belum tersedia. Lihat openapi.yaml untuk kontrak final.`,
      request_id: crypto.randomUUID(),
    },
    { status: 404 }
  );
}

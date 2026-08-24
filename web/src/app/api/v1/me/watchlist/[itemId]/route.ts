import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { watchlists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: "NO_USER" }, { status: 500 });
  }

  const deleted = await db
    .delete(watchlists)
    .where(and(eq(watchlists.id, itemId), eq(watchlists.userId, user.id)))
    .returning({ id: watchlists.id });

  if (deleted.length === 0) {
    return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ status: "deleted" });
}

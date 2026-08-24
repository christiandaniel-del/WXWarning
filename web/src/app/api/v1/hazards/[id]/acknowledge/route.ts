import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { acknowledgments, users } from "@/db/schema";

const DEV_EMAIL = "dev@wxwarning.local";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [user] = await db.select().from(users).where(eq(users.email, DEV_EMAIL));
  if (!user) {
    return NextResponse.json(
      { code: "NO_USER", message: "Jalankan npm run db:seed dulu" },
      { status: 500 }
    );
  }

  const inserted = await db
    .insert(acknowledgments)
    .values({ hazardId: id, userId: user.id })
    .onConflictDoNothing()
    .returning({ id: acknowledgments.id, ackedAt: acknowledgments.ackedAt });

  if (inserted.length === 0) {
    return NextResponse.json({ status: "already_acknowledged" });
  }

  return NextResponse.json({ status: "acknowledged", ...inserted[0] }, { status: 201 });
}

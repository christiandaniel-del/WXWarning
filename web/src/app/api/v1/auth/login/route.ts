import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { code: "INVALID_CREDENTIALS", message: "Email atau password salah" },
      { status: 401 }
    );
  }

  await createSession(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  });
}

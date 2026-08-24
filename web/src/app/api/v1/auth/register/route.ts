import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const displayName =
    typeof body?.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 60)
      : email.split("@")[0];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Email tidak valid" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Password minimal 8 karakter" },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return NextResponse.json(
      { code: "EMAIL_TAKEN", message: "Email sudah terdaftar" },
      { status: 409 }
    );
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashPassword(password),
      displayName,
      role: "pilot",
    })
    .returning();

  await createSession(user.id);

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    },
    { status: 201 }
  );
}

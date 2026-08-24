import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { hazards } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("unauthenticated", { status: 401 });
  }

  const encoder = new TextEncoder();
  let lastSeen = new Date();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      send("hello", { server_time: new Date().toISOString() });

      const iv = setInterval(async () => {
        if (closed) return;
        try {
          const rows = await db
            .select({
              id: hazards.id,
              type: hazards.type,
              severity: hazards.severity,
              title: hazards.title,
              createdAt: hazards.createdAt,
            })
            .from(hazards)
            .where(
              and(eq(hazards.status, "ACTIVE"), gt(hazards.createdAt, lastSeen))
            )
            .orderBy(desc(hazards.createdAt))
            .limit(10);

          if (rows.length > 0) {
            lastSeen = rows[0].createdAt;
            for (const h of [...rows].reverse()) {
              send("hazard.created", h);
            }
          } else {
            send("ping", { t: Date.now() });
          }
        } catch (e) {
          console.error("[SSE] poll error:", e);
        }
      }, 5000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(iv);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

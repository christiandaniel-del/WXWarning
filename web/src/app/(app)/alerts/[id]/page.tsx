import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { acknowledgments, hazards, users } from "@/db/schema";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { AckButton } from "@/components/ui/ack-button";
import { fmtUtc } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AlertDetailPage({
  params,
}: PageProps<"/alerts/[id]">) {
  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [hazard] = await db.select().from(hazards).where(eq(hazards.id, id));
  if (!hazard) notFound();

  const acks = await db
    .select({
      ackedAt: acknowledgments.ackedAt,
      name: users.displayName,
    })
    .from(acknowledgments)
    .innerJoin(users, eq(acknowledgments.userId, users.id))
    .where(eq(acknowledgments.hazardId, id))
    .orderBy(desc(acknowledgments.ackedAt));

  const raw = JSON.stringify(hazard.rawPayload, null, 2);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <Link href="/alerts" className="text-sm text-muted hover:text-ink">
        ← Alerts
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <SeverityBadge severity={hazard.severity} />
        <span className="font-mono text-xs text-muted uppercase">{hazard.type}</span>
        <span
          className={
            hazard.status === "ACTIVE"
              ? "rounded-full border border-live/40 bg-live/10 px-2.5 py-1 text-xs font-medium text-live"
              : "rounded-full border border-edge px-2.5 py-1 text-xs text-muted"
          }
        >
          {hazard.status}
        </span>
        <div className="ml-auto">
          <AckButton hazardId={hazard.id} acked={acks.length > 0} />
        </div>
      </div>

      <h1 className="mt-3 text-xl leading-snug font-semibold">{hazard.title}</h1>
      <p className="mt-1 text-sm text-muted">{hazard.areaText}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section className="rounded-[var(--radius-card)] border border-edge bg-elevated p-4">
          <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
            Raw payload (immutable)
          </h2>
          <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-base p-3 font-mono text-xs leading-relaxed text-ink">
            {raw.length > 8000 ? raw.slice(0, 8000) + "\n…" : raw}
          </pre>
          <p className="mt-2 text-xs text-muted">
            Data asli dari sumber — selalu verifikasi ke briefing resmi.
          </p>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[var(--radius-card)] border border-edge bg-elevated p-4 text-sm">
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
              Metadata
            </h2>
            <dl className="mt-3 space-y-2">
              <Row k="Valid from" v={fmtUtc(hazard.validFrom)} />
              <Row k="Valid until" v={fmtUtc(hazard.validUntil)} />
              <Row k="Ingested" v={fmtUtc(hazard.createdAt)} />
              <Row k="Hash" v={hazard.canonicalHash.slice(0, 16) + "…"} mono />
            </dl>
          </section>

          <section className="rounded-[var(--radius-card)] border border-edge bg-elevated p-4 text-sm">
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
              Ack history ({acks.length})
            </h2>
            {acks.length === 0 ? (
              <p className="mt-3 text-muted">Belum ada.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {acks.map((a) => (
                  <li key={a.ackedAt.toISOString()} className="flex items-center gap-2">
                    <span className="text-live">✓</span>
                    <span>{a.name}</span>
                    <span className="ml-auto font-mono text-xs text-muted">
                      {fmtUtc(a.ackedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className={mono ? "font-mono text-xs" : "font-mono text-xs text-ink"}>{v}</dd>
    </div>
  );
}

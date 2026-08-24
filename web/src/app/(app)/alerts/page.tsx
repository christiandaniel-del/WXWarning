import Link from "next/link";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { hazards } from "@/db/schema";
import { PageHeader } from "@/components/layout/placeholder";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { fmtAgo, fmtUtc } from "@/lib/format";

export const dynamic = "force-dynamic";

const TYPES = ["sigmet", "metar_alert", "cyclone", "volcano", "quake", "ash"] as const;
const SEVERITIES = ["info", "moderate", "severe", "extreme"] as const;

type HazardTypeValue = (typeof hazards.type.enumValues)[number];
type SeverityValue = (typeof hazards.severity.enumValues)[number];

export default async function AlertsPage({
  searchParams,
}: PageProps<"/alerts">) {
  const sp = await searchParams;
  const type = typeof sp.type === "string" && (TYPES as readonly string[]).includes(sp.type) ? sp.type : null;
  const severity =
    typeof sp.severity === "string" && (SEVERITIES as readonly string[]).includes(sp.severity)
      ? sp.severity
      : null;

  const conditions: SQL[] = [eq(hazards.status, "ACTIVE")];
  if (type) conditions.push(eq(hazards.type, type as HazardTypeValue));
  if (severity) conditions.push(eq(hazards.severity, severity as SeverityValue));

  const rows = await db
    .select()
    .from(hazards)
    .where(and(...conditions))
    .orderBy(desc(hazards.createdAt))
    .limit(100);

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle={`${rows.length} alert aktif · sumber: BMKG, JMA, PVMBG, USGS`}
      />
      <div className="px-4 py-4 lg:px-6">
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <FilterChip label="Semua" href="/alerts" active={!type && !severity} />
          {TYPES.map((t) => (
            <FilterChip
              key={t}
              label={t.toUpperCase()}
              href={`/alerts?type=${t}${severity ? `&severity=${severity}` : ""}`}
              active={type === t}
            />
          ))}
          <span className="mx-1 w-px self-stretch bg-edge" />
          {SEVERITIES.map((s) => (
            <FilterChip
              key={s}
              label={s.toUpperCase()}
              href={`/alerts?severity=${s}${type ? `&type=${type}` : ""}`}
              active={severity === s}
            />
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-edge bg-elevated p-10 text-center text-sm text-muted">
            Tidak ada alert yang cocok dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-elevated">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-edge text-xs tracking-wide text-muted uppercase">
                  <th className="px-4 py-3 font-medium">Umur</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Title / Area</th>
                  <th className="px-4 py-3 font-medium">Valid s/d</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-edge/60 last:border-0 hover:bg-raised/50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{fmtAgo(h.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs uppercase">{h.type}</td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={h.severity} size="sm" />
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <Link href={`/alerts/${h.id}`} className="hover:text-info">
                        {h.title}
                      </Link>
                      <div className="text-xs text-muted">{h.areaText}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted">
                      {fmtUtc(h.validUntil)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full border border-info/50 bg-info/10 px-3 py-1.5 font-medium text-info"
          : "rounded-full border border-edge px-3 py-1.5 text-muted hover:text-ink"
      }
    >
      {label}
    </Link>
  );
}

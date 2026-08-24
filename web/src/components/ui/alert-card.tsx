import Link from "next/link";
import { SeverityBadge, type Severity } from "./severity-badge";
import { clsx } from "@/lib/utils";

export interface AlertCardData {
  id: string;
  type: string;
  severity: Severity;
  title: string;
  area: string;
  age: string;
}

export function AlertCard({ data }: { data: AlertCardData }) {
  return (
    <article
      className={clsx(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-edge bg-elevated p-4"
      )}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1 ${
          data.severity === "extreme"
            ? "bg-extreme"
            : data.severity === "severe"
              ? "bg-severe"
              : data.severity === "moderate"
                ? "bg-moderate"
                : "bg-info"
        }`}
      />
      <div className="flex items-center justify-between gap-2 pl-2">
        <SeverityBadge severity={data.severity} size="sm" />
        <span className="text-xs text-muted">{data.age} lalu</span>
      </div>
      <h3 className="mt-2 pl-2 text-sm font-medium leading-snug">{data.title}</h3>
      <p className="mt-0.5 pl-2 text-xs text-muted">{data.area}</p>
      <div className="mt-3 flex items-center gap-2 pl-2">
        <button
          type="button"
          className="rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-muted hover:text-ink hover:border-muted"
        >
          ACK
        </button>
        <Link
          href={`/alerts/${data.id}`}
          className="rounded-lg border border-edge px-3 py-1.5 text-xs text-info hover:bg-info/10"
        >
          Detail ↗
        </Link>
      </div>
    </article>
  );
}

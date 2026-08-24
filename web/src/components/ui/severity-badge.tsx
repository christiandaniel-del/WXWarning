import { clsx } from "@/lib/utils";

export type Severity = "extreme" | "severe" | "moderate" | "info";

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; bar: string; chip: string }
> = {
  extreme: {
    label: "EXTREME",
    bar: "bg-extreme",
    chip: "text-extreme border-extreme/40 bg-extreme/10",
  },
  severe: {
    label: "SEVERE",
    bar: "bg-severe",
    chip: "text-severe border-severe/40 bg-severe/10",
  },
  moderate: {
    label: "MODERATE",
    bar: "bg-moderate",
    chip: "text-moderate border-moderate/40 bg-moderate/10",
  },
  info: {
    label: "INFO",
    bar: "bg-info",
    chip: "text-info border-info/40 bg-info/10",
  },
};

export function SeverityBadge({
  severity,
  size = "md",
}: {
  severity: Severity;
  size?: "sm" | "md";
}) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide uppercase",
        cfg.chip,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={`h-2 w-2 rounded-full ${cfg.bar}`} aria-hidden />
      {cfg.label}
    </span>
  );
}

export function fmtZ(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(date.getUTCDate())}${p(date.getUTCHours())}${p(date.getUTCMinutes())}Z`;
}

export function fmtAgo(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}j lalu`;
  return `${Math.round(hours / 24)}h lalu`;
}

export function fmtUtc(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(date.getUTCDate())} ${date.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${p(date.getUTCHours())}:${p(date.getUTCMinutes())}Z`;
}

export type HazardType =
  | "sigmet"
  | "metar_alert"
  | "cyclone"
  | "volcano"
  | "quake";

export interface Hazard {
  id: string;
  type: HazardType;
  severity: "extreme" | "severe" | "moderate" | "info";
  title: string;
  area_text: string;
  valid_from: string;
  valid_until: string;
  status: "ACTIVE" | "EXPIRED";
  source_name: string;
}

export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

import { OpsMap } from "@/components/map/ops-map";

export default function MapPage() {
  return (
    <div
      className="relative"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      <OpsMap />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const DARK_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "basemap", type: "raster", source: "carto" }],
};

const COLOR_CODE_STYLE: Record<string, { color: string; label: string }> = {
  RED: { color: "#ff3b30", label: "RED" },
  ORANGE: { color: "#ff9500", label: "ORANGE" },
  YELLOW: { color: "#ffd60a", label: "YELLOW" },
  GREEN: { color: "#34c759", label: "GREEN" },
};

function circlePolygon(
  lat: number,
  lon: number,
  radiusKm: number,
  steps = 24
): number[][] {
  const coords: number[][] = [];
  const d = radiusKm / 6371;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;
  for (let i = 0; i <= steps; i++) {
    const brg = ((i * 360) / steps) * (Math.PI / 180);
    const φ2 = Math.asin(
      Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(brg)
    );
    const λ2 =
      λ1 +
      Math.atan2(
        Math.sin(brg) * Math.sin(d) * Math.cos(φ1),
        Math.cos(d) - Math.sin(φ1) * Math.sin(φ2)
      );
    coords.push([(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI]);
  }
  return coords;
}

async function addRealData(map: any, maplibregl: any) {
  const [cyc, vol, eq, ash] = await Promise.all([
    fetch("/api/v1/cyclones", { cache: "no-store" }).then((r) => r.json()),
    fetch("/api/v1/volcanoes?active=true", { cache: "no-store" }).then((r) => r.json()),
    fetch("/api/v1/earthquakes?min_mag=5.5", { cache: "no-store" }).then((r) => r.json()),
    fetch("/api/v1/ash", { cache: "no-store" }).then((r) => r.json()),
  ]);

  const ashFeatures = (ash.data ?? []).map((a: any) => ({
    type: "Feature",
    properties: { title: a.title, severity: a.severity },
    geometry: a.geom,
  }));
  if (ashFeatures.length > 0) {
    map.addSource("ash", {
      type: "geojson",
      data: { type: "FeatureCollection", features: ashFeatures },
    });
    map.addLayer({
      id: "ash-fill",
      type: "fill",
      source: "ash",
      paint: { "fill-color": "#8a94a6", "fill-opacity": 0.3 },
    });
    map.addLayer({
      id: "ash-line",
      type: "line",
      source: "ash",
      paint: {
        "line-color": "#e6eaf0",
        "line-width": 1.5,
        "line-dasharray": [3, 2],
      },
    });
    map.on("click", "ash-fill", (e: any) => {
      const f = e.features?.[0];
      if (!f) return;
      new maplibregl.Popup({ offset: 6, closeButton: false })
        .setLngLat(e.lngLat)
        .setHTML(
          `<strong style="color:#e6eaf0">☁ ${f.properties.title}</strong><br/><span style="color:#8a94a6">Volcanic ash advisory — VAAC Darwin</span>`
        )
        .addTo(map);
    });
  }

  for (const c of cyc.data ?? []) {
    const past = c.track.filter((p: any) => !p.isForecast);
    const fc = c.track.filter((p: any) => p.isForecast);
    if (past.length === 0 && fc.length === 0) continue;

    const fcFeatures = fc
      .filter((p: any) => p.uncertaintyRadiusKm)
      .map((p: any) => ({
        type: "Feature",
        properties: { hours: p.validTime, wind: p.maxWindKt },
        geometry: {
          type: "Polygon",
          coordinates: circlePolygon(p.lat, p.lon, p.uncertaintyRadiusKm),
        },
      }));

    map.addSource(`cyc-fc-${c.id}`, {
      type: "geojson",
      data: { type: "FeatureCollection", features: fcFeatures },
    });
    if (fcFeatures.length > 0) {
      map.addLayer({
        id: `cyc-fc-${c.id}`,
        type: "fill",
        source: `cyc-fc-${c.id}`,
        paint: { "fill-color": "#ff9500", "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: `cyc-fc-line-${c.id}`,
        type: "line",
        source: `cyc-fc-${c.id}`,
        paint: { "line-color": "#ff9500", "line-width": 1, "line-opacity": 0.5 },
      });
    }

    const trackCoords = [...past, ...fc].map((p: any) => [p.lon, p.lat]);
    map.addSource(`cyc-track-${c.id}`, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: { name: `${c.category} ${c.designator} ${c.name}` },
        geometry: { type: "LineString", coordinates: trackCoords },
      },
    });
    map.addLayer({
      id: `cyc-track-${c.id}`,
      type: "line",
      source: `cyc-track-${c.id}`,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#ff9500", "line-width": 2.5 },
    });

    const cur = past.at(-1) ?? fc[0];
    const el = document.createElement("div");
    el.style.cssText =
      "display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;";
    el.innerHTML = `<span style="width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 35%, #ffd60a, #ff9500 60%, #ff3b30);border:2px solid #0b0e13;box-shadow:0 0 12px #ff9500;"></span><span style="background:#12161fe6;border:1px solid #232a36;border-radius:6px;padding:2px 7px;font:bold 11px sans-serif;color:#ff9500;">${c.category} ${c.name}</span>`;
    el.addEventListener("click", () => {
      new maplibregl.Popup({ offset: 12, closeButton: false })
        .setLngLat([cur.lon, cur.lat])
        .setHTML(
          `<strong style="color:#ff9500">${c.category} ${c.designator} ${c.name}</strong><br/>${cur.maxWindKt ?? "?"} kt G${cur.gustKt ?? "?"} · ${cur.pressureHpa ?? "?"} hPa<br/><span style="color:#8a94a6">${cur.lat.toFixed(1)}°, ${cur.lon.toFixed(1)}°</span>`
        )
        .addTo(map);
    });
    new maplibregl.Marker({ element: el })
      .setLngLat([cur.lon, cur.lat])
      .addTo(map);
  }

  for (const v of vol.data ?? []) {
    const st = COLOR_CODE_STYLE[v.colorCode] ?? COLOR_CODE_STYLE.GREEN;
    const el = document.createElement("div");
    el.style.cssText =
      "font:bold 15px sans-serif;color:" +
      st.color +
      ";text-shadow:0 0 6px " +
      st.color +
      ", 0 0 2px #0b0e13;cursor:pointer;";
    el.textContent = "▲";
    el.title = `${v.name} · ${st.label}`;
    el.addEventListener("click", () => {
      new maplibregl.Popup({ offset: 10, closeButton: false })
        .setLngLat([v.lon, v.lat])
        .setHTML(
          `<strong style="color:${st.color}">▲ ${v.name}</strong><br/>Color code: <strong>${st.label}</strong><br/><span style="color:#8a94a6">${v.lat.toFixed(2)}°, ${v.lon.toFixed(2)}°</span>`
        )
        .addTo(map);
    });
    new maplibregl.Marker({ element: el })
      .setLngLat([v.lon, v.lat])
      .addTo(map);
  }

  const eqFeatures = (eq.data ?? []).map((q: any) => ({
    type: "Feature",
    properties: {
      mag: q.magnitude,
      place: q.place,
      depth: q.depthKm,
      time: q.occurredAt,
    },
    geometry: { type: "Point", coordinates: [q.lon, q.lat] },
  }));

  if (eqFeatures.length > 0) {
    map.addSource("quakes", {
      type: "geojson",
      data: { type: "FeatureCollection", features: eqFeatures },
    });
    map.addLayer({
      id: "quake-circles",
      type: "circle",
      source: "quakes",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "mag"],
          5,
          6,
          6,
          10,
          7,
          16,
        ],
        "circle-color": "#ffd60a",
        "circle-opacity": 0.35,
        "circle-stroke-color": "#ffd60a",
        "circle-stroke-width": 1.5,
      },
    });
    map.on("click", "quake-circles", (e: any) => {
      const f = e.features?.[0];
      if (!f) return;
      new maplibregl.Popup({ offset: 8, closeButton: false })
        .setLngLat(f.geometry.coordinates)
        .setHTML(
          `<strong style="color:#ffd60a">M${f.properties.mag.toFixed(1)}</strong> · depth ${Math.round(f.properties.depth)}km<br/><span style="color:#8a94a6">${f.properties.place}</span>`
        )
        .addTo(map);
    });
  }
}

export function OpsMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let map: any = null;
    let cancelled = false;

    (async () => {
      try {
        const specifier = new URL(
          "/vendor/maplibre/maplibre-gl.mjs",
          window.location.origin
        ).href;
        const maplibregl: any = await import(
          /* turbopackIgnore: true */ specifier
        );
        if (cancelled || !containerRef.current) return;

        map = new maplibregl.Map({
          container: containerRef.current,
          style: DARK_STYLE,
          center: [118, -2],
          zoom: 2.6,
        });

        map.on("error", (e: any) => {
          console.error("[WXWarning map]", e?.error ?? e);
        });

        map.on("load", async () => {
          if (cancelled) return;
          setStatus("ready");
          map.resize();
          try {
            await addRealData(map, maplibregl);
          } catch (e) {
            console.error("[WXWarning map] data load failed:", e);
          }
        });
      } catch (e) {
        console.error("[WXWarning map] init failed:", e);
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(e instanceof Error ? e.message : "unknown error");
        }
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <div className="relative h-full w-full bg-base">
      <link rel="stylesheet" href="/vendor/maplibre/maplibre-gl.css" />
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0 }}
      />
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <span className="rounded-lg border border-edge bg-elevated px-4 py-2 text-sm text-muted">
            Memuat peta…
          </span>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div className="max-w-md rounded-xl border border-extreme/40 bg-elevated p-4 text-sm">
            <p className="font-semibold text-extreme">Peta gagal dimuat</p>
            <p className="mt-1 text-muted">{errorMsg}</p>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5 rounded-xl border border-edge bg-elevated/90 p-3 text-xs backdrop-blur">
        <span className="font-semibold tracking-wide text-muted uppercase">
          Layers
        </span>
        {[
          ["#ff9500", "Cyclone (track + cone)"],
          ["#e6eaf0", "Volcanic ash (VAAC)"],
          ["#ff3b30", "Volcano color code"],
          ["#ffd60a", "Quake M≥5.5"],
        ].map(([c, l]) => (
          <span key={l} className="inline-flex items-center gap-2 text-ink">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: c }}
            />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

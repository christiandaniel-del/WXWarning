# WXWarning — Web

Real-time weather & disaster warning dashboard for pilots and flight dispatchers.
Per `../PRD-v1.0.md` · API contract: `../openapi.yaml` · wireframes: `../wireframes-v1.0.md`.

## Running

```powershell
cd WXWarning\web
npm install
npm run dev
```

Open http://localhost:3000 → redirects to `/dashboard`.

## Pages

| Route | Status |
|---|---|
| `/dashboard` | ✅ **real data from database** (BMKG + USGS earthquakes) |
| `/map` | ✅ MapLibre map + sample markers |
| `/alerts`, `/alerts/[id]` | stub |
| `/airports`, `/cyclones`, `/volcanoes`, `/earthquakes` | stub |
| `/settings`, `/admin` | stub |
| `/api/v1/hazards` | ✅ real data + filters `?type=&severity=&active=` |
| `/api/admin/ingest` | ✅ trigger ingest (`POST`, optional header `x-ingest-secret`) |
| `/api/health/db` | ✅ database connection check |

## Map implementation notes (important)

MapLibre GL v6 is loaded **without a bundler** (runtime dynamic import of
`public/vendor/maplibre/maplibre-gl.mjs` + `turbopackIgnore`) because of two issues:

1. Turbopack error on dynamic import with absolute URL ("server relative imports
   are not implemented yet")
2. The maplibre CSS adds the class `maplibregl-map` (position:relative) to the
   container, overriding Tailwind's `absolute inset-0` → container height 0px.
   Fix: container position set via inline style, page height via inline
   `calc(100vh - 3.5rem)`.

If upgrading maplibre, copy the 4 files again from `node_modules/maplibre-gl/dist/`
to `public/vendor/maplibre/`.

## Ingest Pipeline

Active adapters: **BMKG earthquakes** (M≥5) & **USGS earthquakes** (M≥5.5).
JTWC / VAAC / PVMBG_MAGMA: structures are ready, adapters coming next.

- Manual trigger: `curl -X POST http://localhost:3000/api/admin/ingest`
- Automatic dedupe via `canonical_hash` (rerun = 0 new)
- Every run is recorded in the `ingest_logs` table
- Production: `vercel.json` cron every 5 minutes

## Structure

```
src/
├── app/                  # route pages + api handlers
├── components/
│   ├── layout/           # app-shell, nav, placeholder
│   ├── map/              # ops-map (MapLibre)
│   └── ui/               # severity-badge, status, alert-card
└── lib/                  # types & utils
```

## Design tokens

Defined in `src/app/globals.css` (Tailwind v4 `@theme`):
`bg-base #0B0E13`, `bg-elevated #12161F`, severity `extreme/severe/moderate/info`,
`text-ink`, `text-muted`, `live`. Examples: `bg-elevated`, `text-severe`, `border-edge`.

## Next steps (PRD M1–M2)

1. ✅ Neon Postgres database — connected, 12 tables, seeded
2. ✅ Ingest workers — BMKG + USGS earthquakes live, dedupe + logging
3. JTWC (cyclone) & PVMBG MAGMA (volcano color code) adapters
4. Auth (argon2 + JWT)
5. WebSocket/SSE stream + Web Push (VAPID keys)

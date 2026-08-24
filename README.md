# WXWarning

Real-time weather & disaster warning dashboard for pilots and flight dispatchers.
WXWarning aggregates hazards from multiple public sources — earthquakes (BMKG,
USGS), tropical cyclones (JMA/JTWC), volcanic ash (VAAC Darwin), volcano activity
(PVMBG MAGMA), and airport weather (AWC METAR/TAF) — into a single real-time
dashboard with an operational map, REST API, and per-airport watchlists.

> ⚠️ **Safety disclaimer:** WXWarning is a situational-awareness aid only.
> Official sources (ATIS, NOTAM, flight briefing, ATC) remain authoritative for
> operational flight decisions.

## Repository layout

```
WXWarning/
├── web/                 # Next.js app (dashboard + API), see web/README.md
├── PRD-v1.0.md          # Product requirements document
├── wireframes-v1.0.md   # UI wireframes
└── openapi.yaml         # API contract
```

## Tech stack

- Next.js 16 (App Router) + Tailwind CSS v4
- Drizzle ORM + Neon Postgres (13 tables)
- MapLibre GL for the operations map
- Ingest adapters with automatic dedupe (`canonical_hash`) + run logging
- Deploy target: Vercel (ingest cron every 5 minutes via `web/vercel.json`)

## Quick start

```powershell
cd web
npm install
npm run dev        # http://localhost:3000 → /login
```

Copy `web/.env.example` to `web/.env.local` and fill in `DATABASE_URL`, `JWT_SECRET`.

## Documentation

- [PRD v1.0](PRD-v1.0.md) — goals, personas, milestones
- [Wireframes](wireframes-v1.0.md) — page-by-page UI design
- [OpenAPI spec](openapi.yaml) — REST API contract
- [Web app details](web/README.md) — pages, ingest pipeline, implementation notes

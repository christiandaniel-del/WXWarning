# WXWarning — Web

Dashboard real-time warning cuaca & bencana untuk pilot dan flight dispatcher.
Sesuai `../PRD-v1.0.md` · kontrak API: `../openapi.yaml` · wireframe: `../wireframes-v1.0.md`.

## Menjalankan

```powershell
cd WXWarning\web
npm install
npm run dev
```

Buka http://localhost:3000 → redirect ke `/dashboard`.

## Halaman

| Route | Status |
|---|---|
| `/dashboard` | ✅ **data real dari database** (gempa BMKG + USGS) |
| `/map` | ✅ peta MapLibre + marker sample |
| `/alerts`, `/alerts/[id]` | stub |
| `/airports`, `/cyclones`, `/volcanoes`, `/earthquakes` | stub |
| `/settings`, `/admin` | stub |
| `/api/v1/hazards` | ✅ real data + filter `?type=&severity=&active=` |
| `/api/admin/ingest` | ✅ trigger ingest (`POST`, opsional header `x-ingest-secret`) |
| `/api/health/db` | ✅ cek koneksi database |

## Catatan implementasi peta (penting)

MapLibre GL v6 dimuat **tanpa bundler** (dynamic import runtime ke
`public/vendor/maplibre/maplibre-gl.mjs` + `turbopackIgnore`) karena dua masalah:

1. Turbopack error pada dynamic import URL absolut ("server relative imports
   are not implemented yet")
2. CSS maplibre menambahkan class `maplibregl-map` (position:relative) pada
   container yang menimpa `absolute inset-0` Tailwind → container tinggi 0px.
   Solusi: posisi container diset via inline style, tinggi halaman via inline
   `calc(100vh - 3.5rem)`.

Jika upgrade maplibre, salin ulang 4 file dari `node_modules/maplibre-gl/dist/`
ke `public/vendor/maplibre/`.

## Ingest Pipeline

Adapter aktif: **BMKG gempa** (M≥5) & **USGS gempa** (M≥5.5).
JTWC / VAAC / PVMBG_MAGMA: struktur siap, adapter menyusul.

- Trigger manual: `curl -X POST http://localhost:3000/api/admin/ingest`
- Dedupe otomatis via `canonical_hash` (jalankan ulang = 0 new)
- Setiap run tercatat di tabel `ingest_logs`
- Produksi: `vercel.json` cron tiap 5 menit

## Struktur

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

Terdapat di `src/app/globals.css` (Tailwind v4 `@theme`):
`bg-base #0B0E13`, `bg-elevated #12161F`, severity `extreme/severe/moderate/info`,
`text-ink`, `text-muted`, `live`. Contoh: `bg-elevated`, `text-severe`, `border-edge`.

## Langkah berikutnya (M1–M2 PRD)

1. ✅ Database Neon Postgres — terhubung, 12 tabel, seed selesai
2. ✅ Ingest workers — BMKG + USGS gempa live, dedupe + logging
3. Adapter JTWC (siklon) & PVMBG MAGMA (volcano color code)
4. Auth (argon2 + JWT)
5. WebSocket/SSE stream + Web Push (VAPID keys)

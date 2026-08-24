# WXWarning — Catatan Handover (24 Agustus 2026)

> Baca ini sebelum melanjutkan development. Semua yang penting ada di sini.

## 1. Cara Menjalankan Kembali

```powershell
cd C:\Users\chris\OneDrive\Desktop\OpenProject\WXWarning\web
npm run dev          # buka http://localhost:3000 → redirect ke /login
```

Login: **chris@wxwarning.test / test12345** (akun test yang sudah dibuat)
atau daftar akun baru di halaman login.

## 2. Rahasia & Kredensial (JANGAN HILANG)

Semua di `WXWarning/web/.env.local` (tidak ikut git):

| Key | Isi | Catatan |
|---|---|---|
| `DATABASE_URL` | Neon Postgres (ep-orange-night-axc38pf5, us-east-2) | **WAJIB rotate password di console Neon sebelum production** — connection string pernah lewat chat |
| `JWT_SECRET` | hex 64 char | Kalau hilang, semua sesi user invalid — tinggal generate baru |

Dashboard Neon: https://neon.tech → project database berisi 13 tabel + data real.

## 3. Perintah Penting

| Perintah | Fungsi |
|---|---|
| `npm run dev` | dev server (port 3000) |
| `npm run build` | production build — **matikan dulu dev server** (konflik lock file OneDrive di folder `.next`) |
| `npm run db:push` | update skema DB setelah edit `src/db/schema.ts` |
| `npm run db:seed` | seed sumber data + dev user |
| `node --env-file=.env.local scripts/seed-airports.mjs` | seed 24 bandara |
| `node --env-file=.env.local scripts/check.mjs` | cek isi DB (siklon, gunung, hazard) |
| `curl -X POST http://localhost:3000/api/admin/ingest` | trigger ingest semua sumber |
| `curl -X POST ".../api/admin/ingest?source=BMKG"` | trigger satu sumber (BMKG/JMA/USGS/PVMBG_MAGMA/VAAC_DARWIN/AWC_METAR) |
| `GET /api/health/db` | cek koneksi database |

## 4. Arsitektur Singkat

```
Sumber data (6)                    Next.js 16 + Tailwind v4 + Drizzle + Neon Postgres
├─ BMKG gempa (M≥5)        ─┐
├─ USGS gempa (M≥5.5)       │    ingest adapters → dedupe (canonical_hash)
├─ JMA siklon WPAC          ├─→  tabel hazards + detail tables →
├─ PVMBG MAGMA (69 gunung)  │    REST API + SSE /api/stream →
├─ VAAC Darwin (abu vulkanik)│   8 halaman + peta MapLibre
└─ AWC METAR/TAF (24 bandara)┘
```

- **Dokumen**: `WXWarning/PRD-v1.0.md` · `wireframes-v1.0.md` · `openapi.yaml`
- **Skema DB**: `web/src/db/schema.ts` (13 tabel, enum `hazard_type` ada `ash`)
- **Adapter ingest**: `web/src/lib/ingest/` (6 file adapter + runner.ts)
- **Produksi (belum dideploy)**: `vercel.json` sudah ada cron ingest tiap 5 menit.
  Deploy = push ke GitHub → import di Vercel → set env DATABASE_URL, JWT_SECRET,
  INGEST_SECRET → migrate DB → custom domain.

## 5. JEBAKAN yang Sudah Pernah Terjadi (JANGAN DIULANG)

1. **MapLibre TIDAK boleh dibundel Turbopack** — dynamic import diblokir
   ("server relative imports not implemented"). Solusi yang dipakai: file ESM
   disalin ke `public/vendor/maplibre/` dan dimuat via `import(url_runtime)`
   dengan komentar `/* turbopackIgnore: true */`. Kalau upgrade maplibre,
   salin ulang 4 file dari `node_modules/maplibre-gl/dist/` ke folder itu.
2. **CSS maplibre menimpa Tailwind**: class `maplibregl-map` (position:relative)
   menimpa `absolute inset-0` → container peta tinggi 0px (peta "tidak muncul").
   Solusi: posisi container via **inline style**, bukan class.
3. **`calc()` di kelas Tailwind butuh spasi**: tulis `h-[calc(100dvh_-_3.5rem)]`
   (underscore = spasi). `100dvh-3.5rem` = CSS invalid = tinggi 0.
4. **PowerShell menganggap `[id]` wildcard**: selalu pakai `-LiteralPath` untuk
   path folder route Next.js seperti `alerts/[id]`.
5. **OneDrive mengunci `.next`**: stop dev server + hapus `.next` sebelum build.
6. **JTWC di-geo-block dari Indonesia** (403) — siklon pakai **JMA** sebagai gantinya.
7. **VAAC Darwin**: data diambil dari `POST /aviation/php/process.php`
   (endpoint tersembunyi, ditemukan lewat `va.js`). Tokyo VAAC belum ada adapter
   (saat ini memang nol advisory aktif; struktur halamannya berbeda).
8. **Data quirk AWC**: `temp` desimal (harus di-round), `wdir: "VRB"` untuk angin
   variabel (harus null, bukan integer).

## 6. Status Fitur

✅ SELESAI:
- Auth (register/login/logout, JWT httpOnly 7 hari, semua halaman terproteksi)
- Ingest 6 sumber + dedupe + ingest_logs + cron config (`vercel.json`)
- Dashboard real-time (SSE: pill koneksi, bell counter, auto-refresh)
- Peta: track siklon + cone uncertainty, polygon abu vulkanik, marker gunung
  (color code), lingkaran gempa — semua data real, bisa diklik
- Halaman: /alerts (filter type+severity), /alerts/[id] (raw payload + acknowledge),
  /cyclones, /volcanoes (69 gunung), /earthquakes, /airports (METAR + FLT CAT),
  /airports/[icao] (METAR/TAF + detail), /settings & /admin (masih stub)
- Watchlist bandara (CRUD API sesuai OpenAPI)

⬜ BELUM (backlog):
- Halaman /settings & /admin masih placeholder
- Filter radius watchlist area (API sudah support, UI belum)
- Tokyo VAAC adapter · SIGMET/METAR text feed BMKG (OPMET)
- Role-based access per halaman (admin only untuk /admin)
- Email digest, Web Push (VAPID), mobile app, i18n EN
- Rate limiting serius, refresh token rotation, unit tests

## 7. Keamanan Sebelum Production

- [ ] **Rotate password Neon** (connection string pernah lewat chat)
- [ ] Set `INGEST_SECRET` di env (endpoint ingest sekarang terbuka di dev)
- [ ] JWT_SECRET baru untuk production
- [ ] Aktifkan `secure: true` cookie (otomatis di NODE_ENV=production)
- [ ] Disclaimer safety sudah ada di UI — pastikan tetap ada di versi final
- [ ] Review ToS sumber data (BMKG, BOM, JMA) untuk penggunaan komersial

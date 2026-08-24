# WXWarning — PRD v1.0

> **Status:** Draft | **Tanggal:** 2026-08-24 | **Owner:** —
>
> ⚠️ **Safety disclaimer (WAJIB):** WXWarning adalah alat bantu situational awareness.
> Sumber resmi (ATIS, NOTAM, flight briefing, ATC) tetap otoritatif untuk keputusan operasional penerbangan.

---

## 1. Executive Summary

Pilot dan flight dispatcher harus memantau warning cuaca & bencana (SIGMET, typhoon/cyclone, abu vulkanik, gempa) yang tersebar di banyak sumber berbeda — BMKG, JTWC, VAAC, USGS, NOTAM office — sehingga informasi sering terlambat diterima atau terlewat. **WXWarning** menggabungkan semua hazard tersebut ke dalam satu dashboard real-time dengan push notification < 30 detik, peta operasional, dan watchlist per-airport/per-route. Value: keputusan go/no-go lebih cepat, situational awareness selama pre-flight dan monitoring penerbangan, tanpa membuka puluhan website.

---

## 2. Goals, Objectives & Non-Goals

### Goals
| ID | Goal | Target |
|---|---|---|
| G1 | Latency ingest: dari sumber publik → tampil di dashboard | P95 < 90 detik |
| G2 | Push notification alert baru ke user aktif | P95 < 30 detik |
| Uptime layanan | Availability dashboard & API | ≥ 99.5% bulanan |
| G4 | Satu tampilan untuk semua jenis hazard (wx, typhoon, volcano, quake) | Single pane of glass |

### Objectives v1 (MVP)
Pilot/dispatcher dapat: melihat semua warning aktif dalam 1 layar, menerima push alert sesuai watchlist, memantau track siklon + forecast cone, melihat status gunung berapi (aviation color code) & gempa signifikan (≥ M5.5).

### Non-Goals (v1)
- ❌ Menggantikan official briefing / ATIS / NOTAM system
- ❌ Flight planning / fuel / route calculation
- ❌ Native mobile app (v2; v1 = responsive web + web push)
- ❌ Prediksi cuaca berbasis AI
- ❌ Integrasi sistem maskapai (ops control system)

---

## 3. Personas & User Stories

### Persona 1 — Pilot (PIC / Copilot)
Konteks: cek cepat sebelum & sesudah flight, kadang konektivitas buruk di bandara kecil. Butuh: glanceable, mobile-friendly, hemat data.

### Persona 2 — Flight Dispatcher
Konteks: memantau banyak flight bersamaan dari ops room, layar besar, butuh detail + riwayat + bukti acknowledgment.

### Persona 3 — Admin Ops (tambahan, minor)
Mengelola akun tim & kesehatan feed sumber data.

### User Stories
| ID | Story |
|---|---|
| US-01 | Sebagai pilot, saya ingin melihat status semua bandara di rute saya dalam satu layar, agar bisa menilai risiko cepat sebelum berangkat. |
| US-02 | Sebagai dispatcher, saya ingin notifikasi push saat ada SIGMET/typhoon baru di area pantauan, agar tidak ada warning terlewat. |
| US-03 | Sebagai pilot, saya ingin melihat track topan + cone of uncertainty di peta, agar bisa memvisualkan jaraknya dari rute. |
| US-04 | Sebagai dispatcher, saya ingin acknowledge sebuah alert, agar tim tahu siapa sudah menanganinya. |
| US-05 | Sebagai pilot, saya ingin filter gempa hanya ≥ M5.5 dekat rute, agar tidak terganggu noise. |
| US-06 | Sebagai dispatcher, saya ingin watchlist bandara, agar hanya menerima alert yang relevan. |
| US-07 | Sebagai pilot, saya ingin halaman tetap terbaca saat koneksi lambat (data cache), agar tetap bisa lihat kondisi terakhir. |
| US-08 | Sebagai admin, saya ingin melihat health status tiap sumber data, agar tahu jika ada feed mati. |

---

## 4. Scope Matrix

| Fitur | v1 MVP | v2+ |
|---|---|---|
| Dashboard real-time multi-hazard | ✅ | |
| Ingest METAR/TAF/SIGMET | ✅ (SIGWXML/SIGMET aktif) | arsip historis penuh |
| Typhoon/cyclone track + forecast cone | ✅ | ensemble tracks |
| Volcanic ash advisory + aviation color code | ✅ | ashpuff trajectory animation |
| Earthquake feed (≥ M5.5, filter radius) | ✅ | felt reports |
| Web push notification + email digest | ✅ | SMS/Telegram/WhatsApp |
| Acknowledge alert + audit log | ✅ | workflow escalation |
| Watchlist airport & area geografis | ✅ (radius lingkaran) | polygon custom |
| Peta operasional (MapLibre) | ✅ | overlay wind/isotach GRIB |
| Mode low-bandwidth (cache last-known) | ✅ (dasar) | offline-first PWA penuh |
| Multi-user team + RBAC | ✅ (pilot/dispatcher/admin) | SSO airline |
| Mobile native app | ❌ | ✅ |
| Integrasi ops system maskapai (API out) | ❌ | ✅ |

---

## 5. Information Architecture & Sitemap

```
/login ─────────────────── auth (email+password v1)
/dashboard ─────────────── default landing: ringkasan alert aktif
├── /map ────────────────── peta operasional fullscreen
├── /alerts ─────────────── daftar alert (filter: type/severity/waktu/status)
│   └── /alerts/{id} ────── detail alert + raw text + ack history
├── /airports ───────────── daftar bandara watchlist
│   └── /airports/{icao} ── METAR/TAF/SIGMET terkait bandara tsb
├── /cyclones ───────────── daftar siklon aktif
│   └── /cyclones/{id} ──── track, cone, advisories timeline
├── /volcanoes ──────────── daftar gunung (color code)
│   └── /volcanoes/{id} ─── detail + VONA/ash advisory
├── /earthquakes ────────── feed gempa terbaru (filter magnitudo/radius)
├── /settings ───────────── profil, notifikasi, watchlist, bahasa
└── /admin ──────────────── users, source health, ingest log (admin only)
```

Navigasi global: sidebar (desktop) / bottom tab (mobile): Dashboard · Map · Alerts · More.
Header persisten: indikator koneksi (live/reconnecting/offline), jam UTC + local, badge jumlah alert merah.

---

## 6. User Flows

### F1 — Login pertama kali
1. Buka app → redirect `/login` → login → onboarding: pilih base airport & area pantauan → set channel notifikasi (push browser wajib diizinkan) → masuk `/dashboard`.
2. Error: kredensial salah → pesan inline; server error → retry dengan backoff.

### F2 — Glance check sebelum flight (pilot, mobile)
1. Buka app → dashboard langsung tampilkan: (a) badge alert aktif di watchlist, (b) kartu per-bandara rute dengan status OK/WARN/ALERT.
2. Tap kartu bandara → METAR/TAF raw + terjemahan ringkas.
3. Koneksi lambat → tampilkan cached last-known + timestamp "data per HH:MMZ".

### F3 — Alert baru masuk (dispatcher)
1. Ingest mendeteksi SIGMET/typhoon baru → simpan → evaluasi rule watchlist → push ke subscriber.
2. Browser menerima push (foreground: toast in-app; background: OS notification).
3. Tap notifikasi → deep link `/alerts/{id}` → detail + tombol **Acknowledge**.
4. Ack → catat user+waktu → badge hilang untuk user tsb, tetap tampil di list hingga expired.

### F4 — Monitoring rute vs cyclone (dispatcher, desktop)
1. Buka `/map` → layer Cyclone ON → pilih siklon → cone + garis track + titik forecast per jam.
2. Aktifkan layer Airports → visual check jarak rute vs cone → tap bandara → popup status wx.

### F5 — Sumber data mati (error state)
1. Feed tidak update > staleness threshold (per tipe: METAR 90m, SIGMET 10m, quake 15m).
2. Banner kuning di header: "SIGMET feed stale — last update 14:32Z".
3. Admin melihat detail di `/admin` ingest log. Tidak ada data palsu yang ditampilkan — hanya status stale.

---

## 7. Page Specifications

### 7.1 `/dashboard` (halaman inti)
| Zone | Isi |
|---|---|
| Header | Logo, live-status pill, jam UTC, bell (jumlah alert unack), avatar |
| Strip atas (full width) | Severity ticker: chip horizontal scroll alert aktif sort by severity desc |
| Kiri 60% | **Active Alerts** — grid AlertCard (type icon, severity color bar, judul, area, umur, tombol ack) |
| Kanan 40% | **Watchlist Airports** — tabel ringkas ICAO/IATA · status · METAR singkat · waktu obs; **Hazard Mini-map** thumbnail |
| Footer strip | Source health dots (BMKG/JTWC/VAAC/USGS) + last sync timestamp |
| States | Empty: ilustrasi + "Tidak ada warning aktif"; Loading: skeleton cards; Stale: banner kuning |

### 7.2 `/map`
Fullscreen map MapLibre dark style; kontrol layer (Typhoon/Volcano/Quake/Airports/SIGMET box); panel kanan slide-in saat objek dipilih; timeline slider (±24h untuk track forecast); zoom min dunia, maks regional.

### 7.3 `/alerts` + detail
Tabel paginasi: Time(Z) · Type · Severity · Area/Subject · Status(ACTIVE/EXPIRED/ACKED) · Ack by. Filter bar + search. Detail: metadata lengkap, teks original monospace, mini map lokasi, riwayat ack, tombol share (copy link).

### 7.4 `/airports/{icao}`
Header ICAO/IATA/nama + watchlist toggle; blok METAR & TAF terjemahan ringkas + raw monospace; SIGMET terkait FIR; grafik sparkline visibility/wind 24h (v1.1).

### 7.5 `/settings`
Profil; Notification rules (matrix: tipe hazard × severity × channel); watchlist manager (airport chips, area radius km); bahasa ID/EN; tema dark/light (default dark).

---

## 8. Design System

### Prinsip
Ops-room professional: gelap, kontras tinggi, data-dense, glanceable dalam < 3 detik. Referensi nuansa: Linear (ketegasan) + Bloomberg terminal (densitas) — bukan dashboard SaaS generik.

### Warna (dark theme)
| Token | Hex | Penggunaan |
|---|---|---|
| `bg/base` | `#0B0E13` | latar utama |
| `bg/elevated` | `#12161F` | card, panel |
| `border/subtle` | `#232A36` | divider, outline |
| `text/primary` | `#E6EAF0` | teks utama |
| `text/muted` | `#8A94A6` | label sekunder |
| `sev/extreme` | `#FF3B30` | extreme/alert merah |
| `sev/severe` | `#FF9500` | severe/orange |
| `sev/moderate` | `#FFD60A` | moderate/kuning |
| `sev/info` | `#3B82F6` | advisory/biru |
| `accent/live` | `#34C759` | status live/OK |
| `mono/data` | JetBrains Mono | angka, koordinat, raw text |

### Tipografi
Inter — scale: Display 28/34 semibold · H1 22/28 · H2 18/24 · Body 14/20 · Caption 12/16 · Data mono 13/18. Angka waktu selalu format `DDHHmmZ` (aviation style) di komponen data.

### Spacing & Layout
Grid 4px; gutter 16; radius card 12px; sidebar 240px collapsible; breakpoint: sm <640 (bottom tab), md ≥768, lg ≥1200 (sidebar + 2 kolom).

### Komponen inti
`AlertCard`, `SeverityBadge`, `StatusPill(live/stale/expired)`, `AirportStatusRow`, `AckButton`, `LayerControl`, `TimelineSlider`, `RawTextBlock`, `FilterBar`, `EmptyState`, `StaleBanner`.

### Aksesibilitas (WCAG 2.1 AA)
Kontras ≥ 4.5:1; severity TIDAK hanya by color (selalu ada ikon+label); fokus keyboard terlihat; target tap ≥ 44px; prefers-reduced-motion dihormati.

---

## 9. Functional Requirements (MoSCoW)

| FR-ID | Fitur | Deskripsi | Prioritas | Acceptance Criteria (Given/When/Then) |
|---|---|---|---|---|
| FR-001 | Ingest SIGMET/METAR/TAF | Polling feed resmi (BMKG/ICAO-state feeds), normalisasi & dedupe | Must | Given feed baru tersedia, When worker poll selesai, Then alert muncul di DB ≤ 90 dtk dengan hash unik anti-duplikat |
| FR-002 | Typhoon/cyclone track | Ingest best track + forecast (JTWC/JMA/BMKG), tampilkan posisi, track historis, forecast points + cone of uncertainty | Must | Given siklon aktif, When dibuka di /map, Then cone menampilkan radius uncertainty per jam forecast |
| FR-003 | Volcanic activity | Aviation color code + VONA/advisory abu (Tokyo/Darwin VAAC, PVMBG/MAGMA) | Must | Given kode naik ke Orange+, When ingest, Then push terkirim ke subscriber area ≤ 30 dtk |
| FR-004 | Earthquake feed | Ingest BMKG & USGS, filter default ≥ M5.5 & radius ≤ 300 km dari watchlist | Must | Given gempa ≥ M5.5 terdeteksi, When masuk DB, Then muncul feed ≤ 60 dtk |
| FR-005 | Push notification | Web Push (VAPID) foreground toast + background OS notification, deep-link ke detail | Must | Given alert cocok rule user, Then push P95 ≤ 30 dtk; gagal → retry 3× exponential |
| FR-006 | Acknowledge alert | Dispatcher/pilot ack alert; catat user, waktu; tampil di history | Must | Given alert aktif, When ack, Then badge user hilang & log tersimpan immutable |
| FR-007 | Watchlist | Kelola bandara (chips ICAO) & area lingkaran (pusat+radius km) per user | Must | Given area ditambahkan, When hazard overlap area, Then notifikasi terkirim |
| FR-008 | Filter & search alert | Filter tipe, severity, rentang waktu, status; search teks subject/area | Must | Hasil < 500 ms untuk 10rb baris |
| FR-009 | Real-time stream | WebSocket/SSE: alert baru & update status otomatis tanpa refresh | Must | Reconnect otomatis ≤ 5 dtk setelah drop; indikator live akurat |
| FR-010 | Staleness indicator | Deteksi feed stale per sumber; banner global + dot di footer | Should | Given feed > threshold, Then banner muncul ≤ 1 menit |
| FR-011 | Low-bandwidth mode | Cache last-known payload di localStorage; tampilkan timestamp data | Should | Halaman terbuka & informatif saat 2G/timeout |
| FR-012 | Email digest | Ringkasan harian 06:00Z alert 24 jam terakhir per user | Should | Terkirim tepat ±5 menit, unsubscribe tersedia |
| FR-013 | Audit & ingest log | Semua ingest/ack/gagal tercatat; admin bisa lihat & export CSV | Should | Retensi ≥ 90 hari |
| FR-014 | i18n ID/EN | Seluruh UI bilingual; istilah meteorologis tetap standar ICAO | Could | Toggle instan tanpa reload |
| FR-015 | Share alert | Copy permalink publik-read-only per alert | Won't(v1)→v2 | — |

**Edge cases:** feed duplikat lintas sumber (dedupe by canonical hash); DST/timezone display (semua internal UTC, render lokal); alert expire otomatis (SIGMET validitas dari teks); push permission denied → fallback in-app bell + email.

---

## 10. Non-Functional Requirements

| Kategori | Target |
|---|---|
| Performance | LCP < 2.5s (4G), TTI < 3.5s, API read P95 < 400 ms |
| Availability | ≥ 99.5%/bulan (status page publik) |
| Skala | 5k user, 500 concurrent WS, 50k alert/tahun |
| Keamanan | TLS 1.2+, password bcrypt/argon2, rate limit 100 req/menit/IP, CSP ketat, dependency scan CI |
| Browser | Chrome/Edge ≥ 2 versi terakhir, Firefox ESR, Safari ≥ 16, Android Chrome, iOS Safari |
| Responsif | Fungsional penuh di 360px–2560px |
| Observability | Sentry (error), structured logs, uptime monitor eksternal |
| Data retention | Alert aktif tak terbatas; historis ≥ 2 tahun; log ≥ 90 hari |

---

## 11. Data Model (PostgreSQL)

| Entitas | Field kunci | Relasi |
|---|---|---|
| `users` | id, email, password_hash, role(pilot/dispatcher/admin), locale, created_at | 1-N watchlists, acknowledgments |
| `airports` | icao(PK), iata, name, lat, lon, country, fir_code | N-M via watchlists |
| `watchlists` | id, user_id, type(airport/area), ref_id, center_lat/lon, radius_km | FK users |
| `hazards` | id, source_id, type(sigmet/metar_alert/cyclone/volcano/quake), severity, title, area_text, geom(GeoJSON), valid_from, valid_until, canonical_hash UNIQUE, raw_payload JSONB, status | FK sources |
| `hazard_sources` | id, name(BMKG/JTWC/VAAC_TOKYO/USGS…), url, poll_interval_s, staleness_s, enabled, last_success_at | 1-N hazards |
| `cyclones` | id, hazard_id, name, basin(wp/io/sh), current_cat | 1-N cyclone_points |
| `cyclone_points` | id, cyclone_id, valid_time, lat, lon, max_wind_kt, gust_kt, pressure_hpa, is_forecast, uncertainty_radius_km | FK cyclones |
| `volcanoes` | id, name, lat, lon, country, color_code, code_updated_at, hazard_id | 1-1 hazards opsional |
| `earthquakes` | id, hazard_id, magnitude, depth_km, lat, lon, place, occurred_at | 1-1 hazards |
| `acknowledgments` | id, hazard_id, user_id, acked_at | FK hazards, users |
| `notification_deliveries` | id, user_id, hazard_id, channel(push/email), status(sent/delivered/failed), attempts, sent_at | FK users, hazards |
| `ingest_logs` | id, source_id, started_at, duration_ms, items_new, items_dupe, error | FK sources |

Index: `hazards(status, valid_until)`, `hazards(canonical_hash)`, `acknowledgments(user_id)`, GiST pada `geom`. Prinsip: **append-only** untuk hazards & acknowledgments (immutable audit).

---

## 12. API Specification (REST + WS)

Base: `/api/v1` · Auth: Bearer JWT (access 15m + refresh 7d) · Format: JSON, timestamps ISO-8601 UTC.

| API-ID | Method & Path | Deskripsi | Auth |
|---|---|---|---|
| API-001 | `POST /auth/login` | Login → access+refresh token | public |
| API-002 | `POST /auth/refresh` | Rotasi refresh token | cookie |
| API-003 | `GET /hazards?active=true&type=&severity=&bbox=` | List alert aktif/filter | any |
| API-004 | `GET /hazards/{id}` | Detail alert incl. raw payload | any |
| API-005 | `POST /hazards/{id}/acknowledge` | Ack alert | pilot+ |
| API-006 | `GET /airports/{icao}/wx` | METAR/TAF/SIGMET bandara | any |
| API-007 | `GET /cyclones?active=true` · `GET /cyclones/{id}` | Siklon + track points | any |
| API-008 | `GET /volcanoes?country=ID` · `GET /volcanoes/{id}` | Color code & VONA | any |
| API-009 | `GET /earthquakes?min_mag=&radius_km=&since=` | Feed gempa | any |
| API-010 | `GET/POST/DELETE /me/watchlist` | CRUD watchlist | any |
| API-011 | `PUT /me/notification-rules` | Matrix rules notifikasi | any |
| API-012 | `WS /stream` | Push event: `hazard.created/updated/expired`, `source.stale` | any |
| API-013 | `GET /admin/sources` · `GET /admin/ingest-logs` | Health & log | admin |

Contoh `GET /api/v1/hazards?active=true`:
```json
{
  "data": [{
    "id": "hz_01J9...",
    "type": "sigmet",
    "severity": "severe",
    "title": "TS OBS AT 25KM WI FIR UIIB FL200-STNL",
    "area_text": "FIR Ujung Pandang",
    "valid_from": "2026-08-24T03:00:00Z",
    "valid_until": "2026-08-24T09:00:00Z",
    "status": "ACTIVE",
    "source": { "name": "BMKG", "fetched_at": "2026-08-24T03:01:12Z" }
  }],
  "meta": { "count": 1, "server_time": "2026-08-24T03:05:00Z" }
}
```

---

## 13. Auth, Security & Integrations

**Auth/RBAC:** email+password v1 (argon2id); role pilot (read+ack self), dispatcher (read+ack), admin (+user mgmt, source config). Session: JWT short-lived + httpOnly refresh cookie.

**Security:** CSP `default-src 'self'`; input validation Zod di edge; SQL parameterized; rate limit per IP+user; audit append-only; backup DB harian PITR 7 hari; secret via env manager.

**Integrasi sumber data (polling adapters):**

| Sumber | Data | Interval | Lisensi |
|---|---|---|---|
| BMKG (DataOnline/API) | METAR/TAF/SIGMET ID, gempa | 5–10 m | cek ToS, atribusi |
| NOAA/NHC & JTWC | Cyclone advisories/best track | 15 m | Public domain (atribusi) |
| Tokyo/Darwin VAAC | Ash advisories | 15 m | Publik |
| PVMBG MAGMA Indonesia | Volcano color code, VONA | 15 m | atribusi |
| USGS GeoJSON feed | Earthquake M≥5 | 10 m | Public domain |

Setiap adapter: timeout 10s, circuit breaker, normalisasi → schema internal, dedupe `canonical_hash`.

---

## 14. Deployment Plan

**Environments:** `dev` (lokal) → `staging` (auto-deploy dari `main`) → `prod` (tag `v*`, manual approve).

| Komponen | Layanan |
|---|---|
| Frontend + API (Next.js) | Vercel |
| Ingest workers (cron/queue) | Fly.io / Railway container |
| Database | Neon Postgres (branch staging/prod) + PostGIS |
| Cache/pubsub | Upstash Redis |
| CDN & asset | Vercel Edge |
| Error monitoring | Sentry |
| Uptime | BetterStack/UptimeRobot external probe |

**CI/CD (GitHub Actions):** PR → lint + typecheck + unit test + build → preview deploy; merge main → migrate DB (drizzle/prisma migrate) → deploy staging → smoke test API; tag prod → deploy + notify Slack.

**Domain & SSL:** `wxwarning.app` (contoh) via Vercel DNS, SSL otomatis; subdomain `api.` tidak perlu (route handler). Web Push: VAPID keys per environment. **Rollback:** Vercel instant rollback ke deployment sebelumnya; DB migration selalu backward-compatible (expand-contract).

---

## 15. Pre-Launch Checklist & QA Plan

- [ ] Unit test adapter normalisasi (fixture tiap sumber, termasuk malformed)
- [ ] Integration test: ingest → DB → WS → push end-to-end (staging)
- [ ] Load test: 500 WS concurrent, burst 100 alert/menit
- [ ] Chaos: matikan satu sumber → staleness banner tampil, lainnya normal
- [ ] Cross-browser matrix (Chrome/FF/Safari desktop+mobile)
- [ ] Accessibility audit (axe-core, keyboard-only walkthrough F1–F4)
- [ ] Security review: auth bypass, IDOR pada `/hazards/{id}`, rate limit
- [ ] SEO/meta minimal + favicon/PWA manifest
- [ ] Analytics: Posthog (page view, alert open, ack funnel)
- [ ] Legal: halaman disclaimer safety, atribusi data source, privacy policy (data pribadi minimal)
- [ ] Runbook insiden: feed mati massal, DB failover, rollback langkah demi langkah
- [ ] Beta: 3–5 dispatcher + 5 pilot, definisikan kanal feedback

---

## 16. Success Metrics

| KPI | Target (90 hari pasca-launch) |
|---|---|
| Ingest latency P95 (source→DB) | < 90 detik |
| Push delivery P95 (DB→device) | < 30 detik |
| % alert diacknowledge < 5 menit oleh dispatcher | ≥ 80% |
| DAU/registered (dispatcher) | ≥ 60% |
| Crash-free session | ≥ 99.5% |
| False-positive rate alert (laporan user) | < 2% |

---

## 17. Milestones & Roadmap

| Fase | Durasi | Deliverable |
|---|---|---|
| M1 Foundations | Minggu 1–2 | Auth, RBAC, skema DB, skeleton UI design system, CI/CD staging |
| M2 Ingest core | Minggu 3–4 | Adapter SIGMET/METAR/TAF + quake + typhoon, dedupe, `/dashboard` read-only, WS stream |
| M3 Alerts & notif | Minggu 5 | Watchlist, rule engine, web push, ack flow, `/alerts` filter |
| M4 Map & polish | Minggu 6 | MapLibre layers + cone, staleness banner, low-bandwidth cache |
| M5 Beta & hardening | Minggu 7 | Load test, a11y, beta user, bugfix |
| **Launch v1.0** | Minggu 8 | Prod + status page + runbook |
| v1.1 | +4 minggu | Email digest, sparkline bandara, i18n EN penuh |
| v2 | Q+2 | Native app, ash trajectory, integrasi ops-system API |

---

## 18. Risks & Mitigations

| Risiko | Dampak | Prob. | Mitigasi |
|---|---|---|---|
| Sumber data berubah format/API tanpa notice | Feed mati | Sedang | Adapter terisolasi + contract test fixture + staleness alert ke admin |
| ToS/lisensi feed berbayang (terutama BMKG) | Legal | Rendah–Sedang | Review ToS pra-launch; atribusi eksplisit; fallback multi-sumber |
| Alert fatigue (terlalu banyak push) | User mute notif | Tinggi | Rule engine granular + default konservatif + digest email |
| Kesalahan data → keputusan salah | Safety, reputasi | Rendah | Disclaimer permanen, tampilkan raw text asli selalu, timestamp sumber |
| Latensi push meleset di peak | Trust turun | Rendah | Queue Redis + retry, monitoring P95 per channel |
| Solo-dev bus factor | Delivery | Sedang | Dokumen runbook + IaC repo, scope MVP disiplin |

---

## 19. Open Questions

| # | Pertanyaan | Rekomendasi default |
|---|---|---|
| Q1 | Cakupan geografis v1: Indonesia saja (FIR ID) atau Asia-Pasifik? | Mulai FIR Indonesia + siklon Pasifik Barat; mudah diperluas via config |
| Q2 | Apakah perlu akses multi-user tim (satu akun maskapai, banyak member)? | v1 per-user; team workspace di v2 |
| Q3 | Bahasa default UI? | Bahasa Indonesia default, EN toggle |
| Q4 | Perlu mode gelap-saja atau light juga? | Dark-only v1 (sesuai konteks ops), light v1.1 |
| Q5 | Adakah kebutuhan retensi bukti regulasi (ack log untuk audit maskapai)? Export PDF? | Simpan append-only; export CSV admin di v1.1 |

# WXWarning — Wireframes v1.0

> Acuan visual per halaman sesuai PRD section 7.
> Konvensi: `[ ]` tombol · `( )` pilihan · `●` indikator status · `▲` severity bar.
> Tema dark ops (`#0B0E13`), severity merah/oranye/kuning/biru.

---

## W1 — `/dashboard` Desktop ≥1200px

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◼ WXWarning   ● LIVE   14:32Z / 21:32 WIB          🔔(3)  [ID ▾]  (avatar)  │
├──────────────────────────────────────────────────────────────────────────────┤
│ TICKER: ▲[SIGMET UIIB SEVERE] ▲[TY 12W SEVERE] ▲[VONA MERAPI MOD] …→        │
├───────────────────────────────────────────────┬──────────────────────────────┤
│ ACTIVE ALERTS                    [+ Filter ▾] │ WATCHLIST AIRPORTS           │
│ ┌───────────────────────────────────────────┐ │ ┌──────────────────────────┐ │
│ │▲ SIGMET·SEVERE                  2m lalu   │ │ │ WIII ✈ OK     ● 14:30Z  │ │
│ │ TS OBS WI FIR UJUNG PANDANG FL200         │ │ ├──────────────────────────┤ │
│ │ FIR UIIB · s/d 09:00Z         [ACK] [↗]   │ │ │ WIID ⚠ MOD    ● 14:28Z  │ │
│ ├───────────────────────────────────────────┤ │ ├──────────────────────────┤ │
│ │▲ CYCLONE·SEVERE                 18m lalu  │ │ │ WADD ✓ —      ● 14:31Z  │ │
│ │ TY 12W HAIMA · Cat4 · 120kt               │ │ ├──────────────────────────┤ │
│ │ WPAC · cone aktif             [ACK] [↗]   │ │ │ WICC ✓ —      ● 14:29Z  │ │
│ └───────────────────────────────────────────┘ │ └──────────────────────────┘ │
│              [Muat lebih banyak]              │ HAZARD MINI-MAP              │
│                                               │ ┌──────────────────────────┐ │
│                                               │ │  peta + titik alert      │ │
│                                               │ │  [Buka fullscreen ↗]     │ │
│                                               │ └──────────────────────────┘ │
├───────────────────────────────────────────────┴──────────────────────────────┤
│ SOURCE HEALTH: BMKG ● JTWC ● VAAC-TYO ● VAAC-DRW ● USGS ●   sync 14:31Z     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Anotasi:** ticker horizontal-scroll sort severity desc; AlertCard border-left 4px warna
severity; ACK inline; row watchlist klik → `/airports/{icao}`; mini-map klik → `/map`.
**States:** empty = "Tidak ada warning aktif ✓" · loading = skeleton card · stale = banner kuning di bawah header.

---

## W2 — `/dashboard` Mobile <640px

```
┌─────────────────────────┐
│ ◼ WXWarning  ● LIVE 🔔3 │
│ 14:32Z                  │
├─────────────────────────┤
│ [chip][chip][chip] →    │ ← ticker swipe
├─────────────────────────┤
│ ACTIVE ALERTS           │
│ ┌─────────────────────┐ │
│ │▲ SIGMET SEVERE      │ │
│ │ TS OBS FIR UIIB…    │ │
│ │ 2m lalu   [ACK] [↗] │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │▲ CYCLONE SEVERE …   │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ ⌂Dash 🗺Map ☰Alerts ⋯More│ ← bottom tab fixed
└─────────────────────────┘
```

Watchlist & mini-map pindah ke tab **More**. Kartu full-width, target tap ≥44px.

---

## W3 — `/map` Desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Dashboard   ◼ WXWARNING OPS MAP                     ● LIVE    14:32Z      │
├────────────┬─────────────────────────────────────────────────────────────────┤
│ LAYERS     │                                                                 │
│ (☑)Cyclone │       ╭── cone of uncertainty ──╮                               │
│ (☑)Volcano │      ╱    🌀 12W               ╲      ● M5.7 QUAKE            │
│ (☐)Quake   │     ╱   Cat-4                   ╲                              │
│ (☑)Airport │    ╰─────────────────────────────╯    ▲ MERAPI ORANGE          │
│ (☐)SIGMET  │     ── track historis ── · · forecast · ·                      │
│            │                                                                 │
│ TIMELINE   │                          ┌───────────────────────────┐          │
│ ‹ −24h ────●───────── +24h ›         │ 🌀 TY 12W HAIMA           │          │
│            │                          │ Cat4 · 965hPa · 120ktG145 │          │
│ FILTERS    │                          │ pos 18.2N 128.4E ±35km    │          │
│ Sev: all ▾ │                          │ valid +24h                │          │
│ Type: all▾ │                          │ [Detail lengkap →]        │          │
└────────────┴──────────────────────────┴───────────────────────────┴──────────┘
```

**Anotasi:** panel kiri overlay semi-transparan (collapse jadi icon di mobile); slider
timeline menggerakkan posisi track & cone; popup kanan muncul saat objek diklik;
warna cone = severity siklon. Mobile: layer control jadi FAB bottom-right, panel detail
jadi bottom-sheet drag.

---

## W4 — `/alerts` + `/alerts/{id}` Desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ALERTS                                                                       │
│ [Search subject/area…    ] Type:(all▾) Sev:(all▾) Status:(ACTIVE▾) 24h▾     │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIME(Z)   TYPE      SEVERE    SUBJECT / AREA            STATUS   ACK BY     │
│ 14:30     SIGMET    ▲ SEVERE  TS OBS FIR UIIB           ACTIVE   —         │
│ 14:14     CYCLONE   ▲ SEVERE  TY 12W HAIMA WPAC        ACTIVE   d.rahmat   │
│ 13:51     QUAKE     ▼ MOD     M5.7 Halmahera           EXPIRED  a.pilot    │
│ …                                                            ‹1 2 3 … ›     │
└──────────────────────────────────────────────────────────────────────────────┘
```

```
/alerts/{id} ─ detail
┌──────────────────────────────────────────────────────────────────┐
│ ← Alerts      ▲ SIGMET · SEVERE · ACTIVE          [ACK] [Share] │
├──────────────────────────────────────┬───────────────────────────┤
│ FIR UIIB · Ujung Pandang             │  ┌─────────────────────┐  │
│ Valid: 24 Aug 03:00Z → 09:00Z        │  │  mini map area      │  │
│ Sumber: BMKG · fetched 03:01Z        │  │  polygon alert      │  │
├──────────────────────────────────────┤  └─────────────────────┘  │
│ RAW TEXT (monospace, selalu tampil)  │  ACK HISTORY              │
│ ┌──────────────────────────────────┐ │  ✓ d.rahmat 14:16Z       │
│ │ WSID31 WIII 240300               │ │  ✓ a.pilot  14:22Z       │
│ │ UIIB SIGMET 2/26 …               │ │                          │
│ └──────────────────────────────────┘ │  SOURCE: bmkg.go.id ↗    │
└──────────────────────────────────────┴───────────────────────────┘
```

**Anotasi:** severity TIDAK hanya warna — ada label teks + ikon; share = copy permalink;
raw text immutable untuk verifikasi.

---

## W5 — `/airports/{icao}`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Airports   WIII / CGK · Soekarno-Hatta Intl         [+ Watchlist ☆]       │
│ Jakarta, Indonesia · FIR WIIF                        ● METAR OK 14:30Z      │
├───────────────────────────────────┬──────────────────────────────────────────┤
│ METAR · 14:30Z                    │ TAF · 08:00Z · valid 24h                 │
│ Ringkas: Wind 160/08kt · Vis 10km+│ Ringkas: Becoming TS after 18Z           │
│ Temp 29°C · QNH 1009 hPa          │ ⚠ CB temuan pada periode malam          │
│ ▸ Raw: METAR WIII 240630Z…        │ ▸ Raw: TAF WIII 240800Z…                 │
├───────────────────────────────────┴──────────────────────────────────────────┤
│ SIGMET TERKAIT FIR WIIF (0 aktif)                                            │
│ ✓ Tidak ada SIGMET aktif                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ TREND 24H (v1.1)  wind ▁▂▃▅▃▂▁  vis ▇▇▇▆▇▇▇  ceiling ▇▇▅▃▅▇▇                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## W6 — `/cyclones` & `/cyclones/{id}`

List: kartu per siklon (nama, kategori, basin, jarak ke watchlist terdekat).
Detail:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Cyclones   🌀 TY 12W HAIMA · Cat-4 SEVERE          ● ADVISORY #14 12Z     │
├────────────────────────────────────┬─────────────────────────────────────────┤
│  [PETA TRACK + CONE fullscreen]    │ CURRENT  pos 18.2N 128.4E ±35km        │
│  slider timeline −24h…+24h         │          wind 120kt G145 · 965hPa      │
│                                    │          movement 340°/12kt            │
│                                    ├─────────────────────────────────────────┤
│                                    │ FORECAST POINTS                        │
│                                    │ +12h  Cat4  19.8N 126.1E  cone ±60km  │
│                                    │ +24h  Cat3  21.5N 124.0E  cone ±90km  │
│                                    │ +48h  Cat2  …                          │
│                                    ├─────────────────────────────────────────┤
│                                    │ SOURCES: JTWC #14 ↗ · JMA ↗            │
└────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## W7 — `/volcanoes` list & detail

```
LIST: tabel Gunung · Negara · Color Code badge · Terakhir update · jarak watchlist
      Merapi  🟥 ORANGE   VONA #3 12:04Z   212 km dari WICC
      Semeru  🟨 YELLOW   —               …

DETAIL: header color code besar + riwayat perubahan kode;
blok VONA terakhir (raw); blok ash advisory VAAC (raw + peta polygon);
tombol watch gunung.
```

---

## W8 — `/earthquakes`

```
FILTERS  Min mag (5.5▾) · Radius dari watchlist (300km▾) · Rentang (7d▾)
┌──────────────────────────────────────────────────────────────────────────────┐
│ TIME(Z)   MAG  DEPTH  LOKASI                     JARAK WL   TSUNAMI?        │
│ 13:51     5.7  10km   42km NW Halmahera          180km      ✗               │
│ 11:02     6.1  33km   Offshore Sulawesi          95km       ✗               │
└──────────────────────────────────────────────────────────────────────────────┘
Baris klik → expand: mini-map episenter + ring radius + link BMKG/USGS.
```

---

## W9 — `/settings`

```
┌───────────────────────────────┐
│ PROFIL      nama, email, role │
│ NOTIFIKASI  matrix rules:     │
│             ┌───────────────┐ │
│             │ hazard × sev ×│ │
│             │ channel(push/ │ │
│             │ email) toggle │ │
│             └───────────────┘ │
│ WATCHLIST   chips bandara +   │
│             area (map picker) │
│ BAHASA      (●) ID  ( ) EN    │
│ TEMA        (●) Dark ( ) Light│
└───────────────────────────────┘
```

---

## W10 — `/admin` (admin only)

Tabel **Sources**: nama, enabled toggle, interval, last_success_at, status dot.
Tabel **Ingest Logs**: waktu, sumber, durasi, items_new/dupe, error (expandable), export CSV.
Panel **Users**: daftar user, role dropdown, disable akun.

---

## Global Components (semua halaman)

| Komponen | Perilaku |
|---|---|
| LivePill | `● LIVE` hijau / `◌ RECONNECTING` kuning pulse / `○ OFFLINE` merah |
| StaleBanner | kuning full-width di bawah header, hanya saat ada feed stale |
| SeverityBadge | warna + ikon + teks (EXTREME/SEVERE/MODERATE/INFO) |
| AckButton | optimistic update; disabled jika sudah ack oleh user |
| TimeStamp | format `DDHHmmZ`; hover tooltip konversi waktu lokal |
| EmptyState | ikon + kalimat + CTA (misal "Tambah bandara ke watchlist") |

## Interaksi Kunci

1. Push notification tap → deep-link langsung `/alerts/{id}`
2. Semua list: filter tersimpan di URL query (shareable)
3. Keyboard: `/` fokus search, `Esc` tutup panel/map popup
4. Skeleton ≤ 300ms sebelum konten; tidak ada layout shift


import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

const sql = postgres(url, { max: 1 });

const SOURCES = [
  ["BMKG", "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json", 300, 900],
  ["JMA", "https://www.jma.go.jp/bosai/typhoon/data/targetTc.json", 900, 1800],
  ["JTWC", "https://www.metoc.navy.mil/jtwc/", 900, 1800],
  ["VAAC_TOKYO", "https://www.data.jma.go.jp/svd/vaac/", 900, 1800],
  ["VAAC_DARWIN", "https://www.bom.gov.au/aviation/php/process.php?page=volcanic-ash-darwin", 900, 3600],
  ["AWC_METAR", "https://aviationweather.gov/api/data/metar", 300, 1800],
  ["PVMBG_MAGMA", "https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas", 900, 1800],
  ["USGS", "https://earthquake.usgs.gov/earthquakes/feed/", 600, 900],
];

for (const [name, url2, interval, stale] of SOURCES) {
  await sql`
  INSERT INTO hazard_sources (name, url, poll_interval_s, staleness_threshold_s)
  VALUES (${name}, ${url2}, ${interval}, ${stale})
  ON CONFLICT (name) DO NOTHING
  `;
}

await sql`
  INSERT INTO users (email, password_hash, display_name, role)
  VALUES ('dev@wxwarning.local', 'dev-noauth-placeholder', 'Dev Dispatcher', 'dispatcher')
  ON CONFLICT (email) DO NOTHING
`;
console.log("Dev user: dev@wxwarning.local (dispatcher)");

const rows = await sql`SELECT name, poll_interval_s FROM hazard_sources ORDER BY name`;
console.log("Seeded hazard_sources:", rows.map((r) => r.name).join(", "));

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name
`;
console.log("Tables:", tables.map((t) => t.table_name).join(", "));

await sql.end();

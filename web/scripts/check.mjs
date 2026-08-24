import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const c = await sql`
  SELECT c.name, c.international_designator AS desig, c.category, count(p.id) AS pts
  FROM cyclones c LEFT JOIN cyclone_points p ON p.cyclone_id = c.id
  GROUP BY 1, 2, 3 ORDER BY 1`;
console.log("CYCLONES:", JSON.stringify(c, null, 1));

const p = await sql`
  SELECT valid_time, is_forecast, lat, lon, max_wind_kt, uncertainty_radius_km
  FROM cyclone_points ORDER BY valid_time LIMIT 4`;
console.log("SAMPLE POINTS:", JSON.stringify(p, null, 1));

const v = await sql`
  SELECT name, color_code, lat, lon FROM volcanoes
  WHERE color_code != 'GREEN' ORDER BY color_code LIMIT 6`;
console.log("VOLCANOES:", JSON.stringify(v, null, 1));

const h = await sql`
  SELECT type, count(*) FROM hazards WHERE status = 'ACTIVE' GROUP BY type`;
console.log("HAZARDS BY TYPE:", JSON.stringify(h));

await sql.end();

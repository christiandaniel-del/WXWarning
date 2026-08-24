import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const AIRPORTS = [
  ["WIII", "CGK", "Soekarno-Hatta Intl", -6.126, 106.657, "ID", "WIIF"],
  ["WIMM", "KNO", "Kualanamu Intl", 3.642, 98.885, "ID", "WIIF"],
  ["WICC", "BDO", "Husein Sastranegara", -6.901, 107.576, "ID", "WIIF"],
  ["WARR", "SUB", "Juanda Intl", -7.38, 112.787, "ID", "WIIF"],
  ["WADD", "DPS", "I Gusti Ngurah Rai Intl", -8.748, 115.167, "ID", "WAAF"],
  ["WAMM", "MDC", "Sam Ratulangi Intl", 1.549, 124.926, "ID", "WAAF"],
  ["WAAA", "UPG", "Sultan Hasanuddin Intl", -5.062, 119.554, "ID", "WAAF"],
  ["WALL", "BPN", "SAMS Sepinggan", -1.268, 116.894, "ID", "WAAF"],
  ["WAJJ", "DJJ", "Sentani", -2.577, 140.517, "ID", "WAAF"],
  ["WIJJ", "PLM", "Sultan Mahmud Badaruddin II", -2.898, 104.7, "ID", "WIIF"],
  ["WIBB", "PKU", "Sultan Syarif Kasim II", 0.46, 101.444, "ID", "WIIF"],
  ["WIDD", "BTH", "Hang Nadim", 1.121, 104.119, "ID", "WIIF"],
  ["WIHH", "HLP", "Halim Perdanakusuma", -6.266, 106.89, "ID", "WIIF"],
  ["WATE", "LOP", "Zainuddin Abdul Madjid", -8.757, 116.281, "ID", "WAAF"],
  ["WMKK", "KUL", "Kuala Lumpur Intl", 2.746, 101.71, "MY", "WMFC"],
  ["WSSS", "SIN", "Singapore Changi", 1.364, 103.991, "SG", "WSJC"],
  ["VHHH", "HKG", "Hong Kong Intl", 22.308, 113.918, "HK", "VHHH"],
  ["RJAA", "NRT", "Narita Intl", 35.765, 140.386, "JP", "RJC"],
  ["RKSI", "ICN", "Incheon Intl", 37.469, 126.451, "KR", "RKRR"],
  ["ZBAA", "PEK", "Beijing Capital", 40.08, 116.585, "CN", "ZBPE"],
  ["VIDP", "DEL", "Indira Gandhi Intl", 28.556, 77.1, "IN", "VIDF"],
  ["OMDB", "DXB", "Dubai Intl", 25.253, 55.365, "AE", "OMAE"],
  ["EGLL", "LHR", "London Heathrow", 51.47, -0.454, "GB", "EGTT"],
  ["KJFK", "JFK", "John F. Kennedy Intl", 40.641, -73.778, "US", "KZNY"],
];

for (const [icao, iata, name, lat, lon, country, fir] of AIRPORTS) {
  await sql`
    INSERT INTO airports (icao, iata, name, lat, lon, country, fir_code)
    VALUES (${icao}, ${iata}, ${name}, ${lat}, ${lon}, ${country}, ${fir})
    ON CONFLICT (icao) DO NOTHING
  `;
}

const n = await sql`SELECT count(*) FROM airports`;
console.log(`Airports seeded: ${n[0].count}`);

await sql.end();

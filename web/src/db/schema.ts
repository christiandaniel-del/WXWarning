import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["pilot", "dispatcher", "admin"]);
export const locale = pgEnum("locale", ["id", "en"]);
export const watchlistType = pgEnum("watchlist_type", ["airport", "area"]);
export const hazardType = pgEnum("hazard_type", [
  "sigmet",
  "metar_alert",
  "cyclone",
  "volcano",
  "quake",
  "ash",
]);
export const severity = pgEnum("severity", [
  "info",
  "moderate",
  "severe",
  "extreme",
]);
export const hazardStatus = pgEnum("hazard_status", ["ACTIVE", "EXPIRED"]);
export const cycloneBasin = pgEnum("cyclone_basin", [
  "WPAC",
  "IO",
  "SH",
  "ATL",
  "EPAC",
  "CPAC",
]);
export const cycloneCategory = pgEnum("cyclone_category", [
  "TD",
  "TS",
  "STS",
  "TY_C1",
  "TY_C2",
  "TY_C3",
  "TY_C4",
  "TY_C5",
]);
export const volcanoColorCode = pgEnum("volcano_color_code", [
  "GREEN",
  "YELLOW",
  "ORANGE",
  "RED",
]);
export const notifChannel = pgEnum("notif_channel", ["webpush", "email"]);
export const notifStatus = pgEnum("notif_status", [
  "sent",
  "delivered",
  "failed",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  role: userRole("role").notNull().default("pilot"),
  locale: locale("locale").notNull().default("id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const airports = pgTable("airports", {
  icao: varchar("icao", { length: 4 }).primaryKey(),
  iata: varchar("iata", { length: 3 }),
  name: varchar("name", { length: 200 }).notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  country: varchar("country", { length: 2 }).notNull(),
  firCode: varchar("fir_code", { length: 8 }),
});

export const hazardSources = pgTable("hazard_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 60 }).notNull().unique(),
  url: text("url").notNull(),
  pollIntervalS: integer("poll_interval_s").notNull().default(600),
  stalenessThresholdS: integer("staleness_threshold_s").notNull().default(1800),
  enabled: boolean("enabled").notNull().default(true),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
});

export const hazards = pgTable(
  "hazards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => hazardSources.id),
    type: hazardType("type").notNull(),
    severity: severity("severity").notNull().default("info"),
    title: text("title").notNull(),
    areaText: text("area_text"),
    geom: jsonb("geom"),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
    canonicalHash: varchar("canonical_hash", { length: 64 }).notNull(),
    rawPayload: jsonb("raw_payload").notNull(),
    status: hazardStatus("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("hazards_canonical_hash_idx").on(t.canonicalHash),
    index("hazards_status_valid_idx").on(t.status, t.validUntil),
  ]
);

export const watchlists = pgTable(
  "watchlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: watchlistType("type").notNull(),
    icao: varchar("icao", { length: 4 }).references(() => airports.icao),
    centerLat: doublePrecision("center_lat"),
    centerLon: doublePrecision("center_lon"),
    radiusKm: integer("radius_km"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("watchlists_user_idx").on(t.userId)]
);

export const cyclones = pgTable("cyclones", {
  id: uuid("id").primaryKey().defaultRandom(),
  hazardId: uuid("hazard_id")
    .notNull()
    .references(() => hazards.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  internationalDesignator: varchar("international_designator", {
    length: 8,
  }),
  basin: cycloneBasin("basin").notNull(),
  category: cycloneCategory("category").notNull().default("TD"),
  advisoryNumber: integer("advisory_number"),
});

export const cyclonePoints = pgTable(
  "cyclone_points",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cycloneId: uuid("cyclone_id")
      .notNull()
      .references(() => cyclones.id, { onDelete: "cascade" }),
    validTime: timestamp("valid_time", { withTimezone: true }).notNull(),
    isForecast: boolean("is_forecast").notNull().default(false),
    lat: doublePrecision("lat").notNull(),
    lon: doublePrecision("lon").notNull(),
    maxWindKt: integer("max_wind_kt"),
    gustKt: integer("gust_kt"),
    pressureHpa: integer("pressure_hpa"),
    uncertaintyRadiusKm: integer("uncertainty_radius_km"),
  },
  (t) => [index("cyclone_points_cyclone_idx").on(t.cycloneId)]
);

export const volcanoes = pgTable("volcanoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  country: varchar("country", { length: 2 }).notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  colorCode: volcanoColorCode("color_code").notNull().default("GREEN"),
  codeUpdatedAt: timestamp("code_updated_at", { withTimezone: true }),
  hazardId: uuid("hazard_id").references(() => hazards.id, {
    onDelete: "set null",
  }),
});

export const earthquakes = pgTable(
  "earthquakes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hazardId: uuid("hazard_id")
      .notNull()
      .references(() => hazards.id, { onDelete: "cascade" }),
    magnitude: doublePrecision("magnitude").notNull(),
    depthKm: doublePrecision("depth_km").notNull(),
    lat: doublePrecision("lat").notNull(),
    lon: doublePrecision("lon").notNull(),
    place: text("place").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    tsunamiFlag: boolean("tsunami_flag").notNull().default(false),
    sourceName: varchar("source_name", { length: 30 }).notNull(),
  },
  (t) => [index("earthquakes_occurred_idx").on(t.occurredAt)]
);

export const acknowledgments = pgTable(
  "acknowledgments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hazardId: uuid("hazard_id")
      .notNull()
      .references(() => hazards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ackedAt: timestamp("acked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("ack_hazard_user_idx").on(t.hazardId, t.userId)]
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hazardId: uuid("hazard_id")
      .notNull()
      .references(() => hazards.id, { onDelete: "cascade" }),
    channel: notifChannel("channel").notNull(),
    status: notifStatus("status").notNull().default("sent"),
    attempts: integer("attempts").notNull().default(1),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("notif_user_idx").on(t.userId)]
);

export const ingestLogs = pgTable(
  "ingest_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => hazardSources.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    durationMs: integer("duration_ms").notNull().default(0),
    itemsNew: integer("items_new").notNull().default(0),
    itemsDupe: integer("items_dupe").notNull().default(0),
    error: text("error"),
  },
  (t) => [index("ingest_logs_source_idx").on(t.sourceId)]
);

export const airportWx = pgTable("airport_wx", {
  icao: varchar("icao", { length: 4 })
    .primaryKey()
    .references(() => airports.icao),
  metarRaw: text("metar_raw"),
  metarObsAt: timestamp("metar_obs_at", { withTimezone: true }),
  fltCat: varchar("flt_cat", { length: 8 }),
  tempC: integer("temp_c"),
  dewpC: integer("dewp_c"),
  windDir: integer("wind_dir"),
  windKt: integer("wind_kt"),
  visibKm: doublePrecision("visib_km"),
  altimHpa: integer("altim_hpa"),
  cover: varchar("cover", { length: 8 }),
  tafRaw: text("taf_raw"),
  tafIssuedAt: timestamp("taf_issued_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

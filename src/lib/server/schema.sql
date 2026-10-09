CREATE TABLE IF NOT EXISTS rides (
  id          TEXT PRIMARY KEY,
  rider       TEXT NOT NULL,                 -- anonymous short label, e.g. r-4k2p
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ,
  frames      INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS potholes (
  id          SERIAL PRIMARY KEY,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  street      TEXT NOT NULL,
  borough     TEXT NOT NULL,
  direction   TEXT NOT NULL,
  lane        TEXT NOT NULL,
  size        TEXT NOT NULL,
  severity    INT,                           -- null once repaired
  status      TEXT NOT NULL DEFAULT 'open',  -- open | repaired
  first_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo       TEXT
);

-- One row per rider pass over a pothole: the time-series the map, timelines and stats are built from.
CREATE TABLE IF NOT EXISTS sightings (
  id          BIGSERIAL,
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  pothole_id  INT NOT NULL,
  ride_id     TEXT NOT NULL,
  rider       TEXT NOT NULL,
  kind        TEXT NOT NULL,                 -- first_seen | confirmed | worse | better | not_found | repaired
  severity    INT,
  note        TEXT NOT NULL DEFAULT '',
  photo       TEXT,
  yolo_conf   REAL,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  PRIMARY KEY (id, at)
);

CREATE INDEX IF NOT EXISTS potholes_geo ON potholes (lat, lng);
CREATE INDEX IF NOT EXISTS sightings_pothole ON sightings (pothole_id, at DESC);
CREATE INDEX IF NOT EXISTS sightings_ride ON sightings (ride_id, pothole_id);

-- GPS breadcrumbs for each ride: the "ridden streets" layer on the map. Anonymous (no rider label here).
CREATE TABLE IF NOT EXISTS ride_points (
  ride_id  TEXT NOT NULL,
  at       TIMESTAMPTZ NOT NULL,
  lat      DOUBLE PRECISION NOT NULL,
  lng      DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS ride_points_ride ON ride_points (ride_id, at);

-- What kind of hazard it is (pothole | bump | rough), and per-ride diagnostics for tuning the detector.
ALTER TABLE potholes ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'pothole';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS max_yolo REAL NOT NULL DEFAULT 0;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS gemini_calls INT NOT NULL DEFAULT 0;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS last_look TIMESTAMPTZ;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ride';

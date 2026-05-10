-- Laser Matrix table — 1034 rows from Laser_Matryca_Materialowa_20260509_v.1.0.xlsx
-- Run: psql $DATABASE_URL -f scripts/laser-matrix-schema.sql

CREATE TABLE IF NOT EXISTS laser_matrix (
  id              BIGSERIAL PRIMARY KEY,

  -- SEKCJA 1: Identyfikacja Procesu
  laser_type      VARCHAR(50)  NOT NULL,   -- CO2 | DIODE | Fiber Raycus | MOPA | GREEN | IR (1064nm) | UV
  action_type     VARCHAR(100) NOT NULL,   -- Cięcie / Grawerowanie / Znakowanie / …
  kinematics      VARCHAR(50)  NOT NULL,   -- XY (Plotery) | Galvo
  wavelength_nm   INTEGER,                 -- 10600 | 1064 | 532 | 355 | 450
  material        VARCHAR(200) NOT NULL,
  thickness_mm    VARCHAR(50),             -- "N/A" | "0.5" | "3-5mm" etc.

  -- SEKCJA 2: Parametry Mocy i Prędkości
  watts           VARCHAR(20)  NOT NULL,   -- "40W" | "100W" etc.
  speed           VARCHAR(50),             -- "150-250" mm/s
  power_pct       VARCHAR(50),             -- "30-50" %
  passes          VARCHAR(50),             -- "1" | "20-50"

  -- SEKCJA 3: Parametry Kinematyki
  dpi             VARCHAR(50),
  hatch_mm        VARCHAR(50),
  scan_angle_deg  VARCHAR(50),
  wobble_mm       VARCHAR(50),
  frequency_khz   VARCHAR(50),
  pulse_width_ns  VARCHAR(50),

  -- SEKCJA 4: Optyka i Oś Z
  optics_lens     VARCHAR(100),
  defocus_mm      VARCHAR(50),
  z_step_mm       VARCHAR(50),

  -- SEKCJA 5: Asysta Gazowa i Delays
  gas_type        VARCHAR(100),
  gas_pressure    VARCHAR(50),
  galvo_delays    VARCHAR(200),

  -- SEKCJA 6: Uwagi
  notes           TEXT,

  -- Translations (optional — filled by admin; null = fallback to PL)
  material_en     VARCHAR(200),
  material_de     VARCHAR(200),
  action_en       VARCHAR(100),
  action_de       VARCHAR(100),
  notes_en        TEXT,
  notes_de        TEXT,

  -- Audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by      VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_laser_matrix_filter
  ON laser_matrix(laser_type, action_type, material);

CREATE INDEX IF NOT EXISTS idx_laser_matrix_action
  ON laser_matrix(action_type);

CREATE INDEX IF NOT EXISTS idx_laser_matrix_laser
  ON laser_matrix(laser_type);

-- ═══════════════════════════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ═══════════════════════════════════════════════════════════
-- ENUM TIPOVI
-- ═══════════════════════════════════════════════════════════
CREATE TYPE user_role AS ENUM ('admin', 'dispatcher', 'driver');

CREATE TYPE settlement AS ENUM (
  'kacer', 'tara', 'uzice_center', 'other'
);

CREATE TYPE passenger_category AS ENUM (
  'standard', 'elderly', 'youth', 'caregiver', 'low_income'
);

CREATE TYPE vehicle_type AS ENUM (
  'sedan', 'van', 'minibus', 'accessible'
);

CREATE TYPE stop_type AS ENUM (
  'micro_terminal', 'bus_connection', 'health_center',
  'school', 'market', 'admin_building', 'other'
);

CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'assigned',
  'in_progress', 'completed', 'cancelled', 'no_show'
);

CREATE TYPE trip_purpose AS ENUM (
  'healthcare', 'education', 'work', 'shopping',
  'admin_services', 'social', 'other'
);

CREATE TYPE route_type AS ENUM ('kacer', 'tara', 'mixed');

CREATE TYPE override_reason AS ENUM (
  'passenger_request', 'operational_necessity',
  'vehicle_substitution', 'tariff_correction',
  'accessibility_requirement', 'other'
);

CREATE TYPE whatsapp_event_type AS ENUM (
  'trip_assigned', 'trip_starting', 'trip_cancelled'
);

-- ═══════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE NOT NULL,
  full_name    TEXT NOT NULL,
  role         user_role NOT NULL DEFAULT 'dispatcher',
  phone        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- VERSIONED SETTINGS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.setting_versions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to   TIMESTAMPTZ,
  created_by     UUID REFERENCES public.profiles(id),
  config         JSONB NOT NULL,
  notes          TEXT
);

-- ═══════════════════════════════════════════════════════════
-- SERVICE DAYS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.service_days (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date              DATE UNIQUE NOT NULL,
  is_closed         BOOLEAN NOT NULL DEFAULT false,
  closed_reason     TEXT,
  total_bookings    INT NOT NULL DEFAULT 0,
  total_completed   INT NOT NULL DEFAULT 0,
  total_km_served   DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_revenue_rsd DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_by         UUID REFERENCES public.profiles(id)
);

-- ═══════════════════════════════════════════════════════════
-- STOPS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.stops (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_sr          TEXT NOT NULL,
  name_en          TEXT,
  settlement       settlement NOT NULL,
  lat              DECIMAL(10,7) NOT NULL,
  lng              DECIMAL(11,7) NOT NULL,
  geog             GEOGRAPHY(POINT, 4326),
  stop_type        stop_type NOT NULL DEFAULT 'other',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  gradient_warning BOOLEAN NOT NULL DEFAULT false,
  gradient_pct     INT,
  connection_line  TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION stops_set_geog()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geog = ST_SetSRID(
    ST_MakePoint(NEW.lng::float, NEW.lat::float), 4326
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stops_geog_trigger
  BEFORE INSERT OR UPDATE ON public.stops
  FOR EACH ROW EXECUTE FUNCTION stops_set_geog();

-- ═══════════════════════════════════════════════════════════
-- STOP DISTANCES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.stop_distances (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_stop_id  UUID NOT NULL REFERENCES public.stops(id),
  to_stop_id    UUID NOT NULL REFERENCES public.stops(id),
  distance_km   DECIMAL(8,2) NOT NULL,
  duration_min  INT,
  source        TEXT NOT NULL DEFAULT 'manual',
  notes         TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_stops CHECK (from_stop_id != to_stop_id),
  CONSTRAINT unique_stop_pair UNIQUE (from_stop_id, to_stop_id)
);

-- ═══════════════════════════════════════════════════════════
-- VEHICLES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.vehicles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_number          TEXT UNIQUE NOT NULL,
  vehicle_type          vehicle_type NOT NULL DEFAULT 'sedan',
  capacity_passengers   INT NOT NULL DEFAULT 4,
  has_wheelchair_access BOOLEAN NOT NULL DEFAULT false,
  has_child_seat        BOOLEAN NOT NULL DEFAULT false,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- DRIVERS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.drivers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID UNIQUE REFERENCES public.profiles(id),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  license_number  TEXT,
  vehicle_id      UUID REFERENCES public.vehicles(id),
  is_available    BOOLEAN NOT NULL DEFAULT true,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  whatsapp_phone  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- DRIVER QR LOGIN TOKENS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.driver_qr_tokens (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id    UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  token        TEXT UNIQUE NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 days',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════
-- PASSENGERS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.passengers (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name             TEXT NOT NULL,
  last_name              TEXT NOT NULL,
  phone                  TEXT UNIQUE NOT NULL,
  address_text           TEXT,
  settlement             settlement NOT NULL DEFAULT 'other',
  category               passenger_category NOT NULL DEFAULT 'standard',
  needs_wheelchair       BOOLEAN NOT NULL DEFAULT false,
  needs_driver_assist    BOOLEAN NOT NULL DEFAULT false,
  high_priority_medical  BOOLEAN NOT NULL DEFAULT false,
  notes                  TEXT,
  is_active              BOOLEAN NOT NULL DEFAULT true,
  no_show_count_30d      INT NOT NULL DEFAULT 0,
  last_no_show_at        TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by             UUID REFERENCES public.profiles(id)
);

CREATE INDEX passengers_search_idx ON public.passengers
  USING gin(
    to_tsvector('simple', first_name || ' ' || last_name || ' ' || phone)
  );

-- ═══════════════════════════════════════════════════════════
-- CALLBACK REQUESTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.callback_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  handled_by  UUID REFERENCES public.profiles(id),
  handled_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TRIP GROUPS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.trip_groups (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_day_id   UUID NOT NULL REFERENCES public.service_days(id),
  driver_id        UUID REFERENCES public.drivers(id),
  vehicle_id       UUID REFERENCES public.vehicles(id),
  route_type       route_type NOT NULL,
  departure_time   TIME,
  status           TEXT NOT NULL DEFAULT 'draft',
  total_passengers INT NOT NULL DEFAULT 0,
  estimated_km     DECIMAL(10,2),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- BOOKINGS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.bookings (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number          TEXT UNIQUE,

  service_day_id          UUID NOT NULL REFERENCES public.service_days(id),
  passenger_id            UUID NOT NULL REFERENCES public.passengers(id),
  pickup_stop_id          UUID NOT NULL REFERENCES public.stops(id),
  dropoff_stop_id         UUID NOT NULL REFERENCES public.stops(id),
  driver_id               UUID REFERENCES public.drivers(id),
  vehicle_id              UUID REFERENCES public.vehicles(id),
  trip_group_id           UUID REFERENCES public.trip_groups(id),

  pickup_time             TIMESTAMPTZ NOT NULL,
  dropoff_time_estimated  TIMESTAMPTZ,
  actual_pickup_time      TIMESTAMPTZ,
  actual_dropoff_time     TIMESTAMPTZ,
  trip_started_at         TIMESTAMPTZ,

  trip_purpose            trip_purpose NOT NULL DEFAULT 'other',
  notes                   TEXT,
  status                  booking_status NOT NULL DEFAULT 'pending',

  tariff_code             TEXT NOT NULL DEFAULT 'T1',
  tariff_rsd_per_km       DECIMAL(8,2) NOT NULL,
  distance_km             DECIMAL(8,2) NOT NULL,
  duration_min_estimated  INT,

  fare_rsd_calculated     DECIMAL(10,2) NOT NULL,
  subsidy_rsd             DECIMAL(10,2) NOT NULL DEFAULT 0,
  subsidy_reason          TEXT,
  fare_rsd_passenger      DECIMAL(10,2) NOT NULL,
  fare_rsd_operator       DECIMAL(10,2) NOT NULL,

  fare_overridden              BOOLEAN NOT NULL DEFAULT false,
  fare_override_reason         override_reason,
  assignment_overridden        BOOLEAN NOT NULL DEFAULT false,
  assignment_override_reason   override_reason,

  connection_line_id      TEXT,

  satisfaction_score      INT CHECK (satisfaction_score BETWEEN 1 AND 5),
  satisfaction_rated_at   TIMESTAMPTZ,
  satisfaction_token      TEXT UNIQUE,

  created_by              UUID NOT NULL REFERENCES public.profiles(id),
  cancelled_by            UUID REFERENCES public.profiles(id),
  cancelled_reason        TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT booking_different_stops CHECK (pickup_stop_id != dropoff_stop_id),
  CONSTRAINT satisfaction_only_completed CHECK (
    satisfaction_score IS NULL OR status = 'completed'
  )
);

-- ═══════════════════════════════════════════════════════════
-- SATISFACTION SURVEYS QUEUE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.satisfaction_surveys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID UNIQUE NOT NULL REFERENCES public.bookings(id),
  status      TEXT NOT NULL DEFAULT 'pending',
  prompted_at TIMESTAMPTZ,
  rated_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- GPS EVENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.gps_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id   UUID NOT NULL REFERENCES public.drivers(id),
  booking_id  UUID REFERENCES public.bookings(id),
  event_type  TEXT NOT NULL,
  lat         DECIMAL(10,7) NOT NULL,
  lng         DECIMAL(11,7) NOT NULL,
  accuracy_m  INT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- WHATSAPP LOG
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.whatsapp_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id    UUID NOT NULL REFERENCES public.drivers(id),
  booking_id   UUID REFERENCES public.bookings(id),
  event        whatsapp_event_type NOT NULL,
  message_text TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'sent',
  error_detail TEXT,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- AUDIT LOG
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  old_value       JSONB,
  new_value       JSONB,
  override_reason override_reason,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- BOOKING NUMBER TRIGGER
-- ═══════════════════════════════════════════════════════════
CREATE SEQUENCE IF NOT EXISTS booking_number_seq;

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT := to_char(NOW(), 'YYYY');
  seq_num  INT;
BEGIN
  seq_num := nextval('booking_number_seq');
  NEW.booking_number := 'DRT-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL)
  EXECUTE FUNCTION generate_booking_number();

-- ═══════════════════════════════════════════════════════════
-- SATISFACTION TOKEN TRIGGER
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION set_satisfaction_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.satisfaction_token IS NULL THEN
    NEW.satisfaction_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_satisfaction_token
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION set_satisfaction_token();

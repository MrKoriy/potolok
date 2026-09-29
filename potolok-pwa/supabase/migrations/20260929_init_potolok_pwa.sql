-- Migration: 20260929_init_potolok_pwa.sql
-- Description: Multi-tenant PWA booking system for ceiling companies & surveyors
-- Features: PostgreSQL btree_gist EXCLUDE constraints, Atomic Transactions, Crypto Token RLS, Outbox Jobs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. TENANTS TABLE
CREATE TABLE IF NOT EXISTS public.tenants (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RESOURCES TABLE (Surveyors / Masters / Installation Teams)
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT NOT NULL,
  tenant_slug TEXT NOT NULL REFERENCES public.tenants(slug) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Инженер-замерщик',
  phone TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_slug, id)
);

CREATE INDEX IF NOT EXISTS idx_resources_tenant ON public.resources (tenant_slug);

-- 3. RESOURCE OCCUPANCIES (Strict Exclusion constraint preventing double booking & slot overlap)
CREATE TABLE IF NOT EXISTS public.resource_occupancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_slug TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  occupied_range TSTZRANGE NOT NULL,
  booking_id TEXT,
  reason TEXT NOT NULL DEFAULT 'appointment', -- 'appointment' | 'blocked' | 'travel_buffer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (tenant_slug, resource_id) REFERENCES public.resources(tenant_slug, id) ON DELETE CASCADE,
  -- Guarantee zero double booking with Postgres GiST:
  EXCLUDE USING gist (
    tenant_slug WITH =,
    resource_id WITH =,
    occupied_range WITH &&
  )
);

CREATE INDEX IF NOT EXISTS idx_occupancies_range ON public.resource_occupancies USING gist (occupied_range);

-- 4. BOOKINGS TABLE
CREATE TYPE booking_status_type AS ENUM (
  'new',
  'confirmed',
  'survey_in_progress',
  'estimate_sent',
  'deal_closed',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT NOT NULL,
  tenant_slug TEXT NOT NULL REFERENCES public.tenants(slug) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  address JSONB NOT NULL, -- { city, street, house, apartment, floor }
  survey_date DATE NOT NULL,
  time_slot TEXT NOT NULL, -- e.g. "11:00 - 13:00"
  surveyor_id TEXT,
  token_hash TEXT NOT NULL, -- SHA-256 hash of client anonymous access token
  estimated_price_min INTEGER NOT NULL DEFAULT 0,
  estimated_price_max INTEGER NOT NULL DEFAULT 0,
  rooms JSONB NOT NULL DEFAULT '[]'::jsonb,
  status booking_status_type NOT NULL DEFAULT 'new',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_slug, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_token_hash ON public.bookings (token_hash);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_date ON public.bookings (tenant_slug, survey_date);

-- 5. NOTIFICATION JOBS (Outbox pattern for Web Push, Telegram, SMS with lease & deduplication)
CREATE TYPE job_status_type AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS public.notification_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_slug TEXT NOT NULL REFERENCES public.tenants(slug) ON DELETE CASCADE,
  booking_id TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'telegram' | 'webpush' | 'sms'
  recipient TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  status job_status_type NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  lease_timeout TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON public.notification_jobs (status, created_at)
WHERE status = 'pending';

-- 6. ATOMIC TRANSACTION: CREATE BOOKING WITH OCCUPANCY LOCK
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_tenant_slug TEXT,
  p_booking_id TEXT,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_address JSONB,
  p_survey_date DATE,
  p_time_slot TEXT,
  p_surveyor_id TEXT,
  p_token_hash TEXT,
  p_min_price INTEGER,
  p_max_price INTEGER,
  p_rooms JSONB,
  p_comment TEXT,
  p_range_start TIMESTAMPTZ,
  p_range_end TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_booking RECORD;
BEGIN
  -- 1. Insert occupancy slot (if overlap exists, EXCLUDE constraint raises error)
  INSERT INTO public.resource_occupancies (
    tenant_slug,
    resource_id,
    occupied_range,
    booking_id,
    reason
  ) VALUES (
    p_tenant_slug,
    p_surveyor_id,
    tstzrange(p_range_start, p_range_end, '[]'),
    p_booking_id,
    'appointment'
  );

  -- 2. Insert booking record
  INSERT INTO public.bookings (
    id,
    tenant_slug,
    client_name,
    client_phone,
    address,
    survey_date,
    time_slot,
    surveyor_id,
    token_hash,
    estimated_price_min,
    estimated_price_max,
    rooms,
    status,
    comment
  ) VALUES (
    p_booking_id,
    p_tenant_slug,
    p_client_name,
    p_client_phone,
    p_address,
    p_survey_date,
    p_time_slot,
    p_surveyor_id,
    p_token_hash,
    p_min_price,
    p_max_price,
    p_rooms,
    'new',
    p_comment
  )
  RETURNING * INTO v_new_booking;

  -- 3. Queue Notification in Outbox
  INSERT INTO public.notification_jobs (
    tenant_slug,
    booking_id,
    channel,
    recipient,
    payload,
    idempotency_key
  ) VALUES (
    p_tenant_slug,
    p_booking_id,
    'telegram',
    'surveyor_bot',
    jsonb_build_object(
      'event', 'new_booking',
      'id', p_booking_id,
      'client', p_client_name,
      'phone', p_client_phone,
      'address', p_address,
      'date', p_survey_date,
      'slot', p_time_slot
    ),
    'job_' || p_booking_id || '_created'
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN row_to_json(v_new_booking)::jsonb;
END;
$$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_occupancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;

-- Tenants: Public read of active tenants
CREATE POLICY "Public can view active tenants"
ON public.tenants FOR SELECT
TO anon, authenticated
USING (active = true);

-- Resources: Public can view active surveyors
CREATE POLICY "Public can view active surveyors"
ON public.resources FOR SELECT
TO anon, authenticated
USING (active = true);

-- Bookings: Anon can view ONLY the booking corresponding to their token hash
CREATE POLICY "Anon can view booking by matching token hash"
ON public.bookings FOR SELECT
TO anon
USING (token_hash = encode(digest(current_setting('request.headers', true)::json->>'x-booking-token', 'sha256'), 'hex'));

-- Bookings: Service role and authenticated tenant owners have full access
CREATE POLICY "Service role full access on bookings"
ON public.bookings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

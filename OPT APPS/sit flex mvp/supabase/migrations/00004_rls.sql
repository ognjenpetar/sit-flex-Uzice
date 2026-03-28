-- Uključi RLS
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setting_versions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_days      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stop_distances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_qr_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_driver_id()
RETURNS UUID AS $$
  SELECT id FROM public.drivers WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── PROFILES ──────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.get_current_role() = 'admin');

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_all_admin" ON public.profiles
  FOR ALL USING (public.get_current_role() = 'admin');

-- ── SETTING VERSIONS ──────────────────────────────────────
CREATE POLICY "settings_select_authenticated" ON public.setting_versions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "settings_insert_admin" ON public.setting_versions
  FOR INSERT WITH CHECK (public.get_current_role() = 'admin');

-- ── SERVICE DAYS ──────────────────────────────────────────
CREATE POLICY "service_days_select_authenticated" ON public.service_days
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_days_insert_dispatcher_admin" ON public.service_days
  FOR INSERT WITH CHECK (public.get_current_role() IN ('dispatcher', 'admin'));

CREATE POLICY "service_days_update_admin" ON public.service_days
  FOR UPDATE USING (public.get_current_role() = 'admin');

-- ── STOPS ─────────────────────────────────────────────────
CREATE POLICY "stops_select_authenticated" ON public.stops
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "stops_write_admin" ON public.stops
  FOR ALL USING (public.get_current_role() = 'admin');

-- ── STOP DISTANCES ────────────────────────────────────────
CREATE POLICY "distances_select_authenticated" ON public.stop_distances
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "distances_write_admin" ON public.stop_distances
  FOR ALL USING (public.get_current_role() = 'admin');

-- ── VEHICLES ──────────────────────────────────────────────
CREATE POLICY "vehicles_select_authenticated" ON public.vehicles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "vehicles_write_admin" ON public.vehicles
  FOR ALL USING (public.get_current_role() = 'admin');

-- ── DRIVERS ───────────────────────────────────────────────
CREATE POLICY "drivers_select_authenticated" ON public.drivers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "drivers_write_admin" ON public.drivers
  FOR ALL USING (public.get_current_role() = 'admin');

-- ── DRIVER QR TOKENS ──────────────────────────────────────
CREATE POLICY "qr_tokens_admin" ON public.driver_qr_tokens
  FOR ALL USING (public.get_current_role() = 'admin');

-- ── PASSENGERS ────────────────────────────────────────────
CREATE POLICY "passengers_select_dispatcher_admin" ON public.passengers
  FOR SELECT USING (public.get_current_role() IN ('dispatcher', 'admin'));

CREATE POLICY "passengers_select_driver" ON public.passengers
  FOR SELECT USING (
    public.get_current_role() = 'driver' AND
    id IN (
      SELECT passenger_id FROM public.bookings
      WHERE driver_id = public.get_current_driver_id()
    )
  );

CREATE POLICY "passengers_write_dispatcher_admin" ON public.passengers
  FOR INSERT WITH CHECK (public.get_current_role() IN ('dispatcher', 'admin'));

CREATE POLICY "passengers_update_dispatcher_admin" ON public.passengers
  FOR UPDATE USING (public.get_current_role() IN ('dispatcher', 'admin'));

-- ── CALLBACK REQUESTS ─────────────────────────────────────
-- Javna INSERT (anon može da pošalje callback request)
CREATE POLICY "callback_insert_anon" ON public.callback_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "callback_select_dispatcher_admin" ON public.callback_requests
  FOR SELECT USING (public.get_current_role() IN ('dispatcher', 'admin'));

CREATE POLICY "callback_update_dispatcher_admin" ON public.callback_requests
  FOR UPDATE USING (public.get_current_role() IN ('dispatcher', 'admin'));

-- ── TRIP GROUPS ───────────────────────────────────────────
CREATE POLICY "trip_groups_select_authenticated" ON public.trip_groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "trip_groups_write_dispatcher_admin" ON public.trip_groups
  FOR ALL USING (public.get_current_role() IN ('dispatcher', 'admin'));

-- ── BOOKINGS ──────────────────────────────────────────────
CREATE POLICY "bookings_select_dispatcher_admin" ON public.bookings
  FOR SELECT USING (public.get_current_role() IN ('dispatcher', 'admin'));

CREATE POLICY "bookings_select_driver" ON public.bookings
  FOR SELECT USING (
    public.get_current_role() = 'driver' AND
    driver_id = public.get_current_driver_id()
  );

CREATE POLICY "bookings_insert_dispatcher_admin" ON public.bookings
  FOR INSERT WITH CHECK (public.get_current_role() IN ('dispatcher', 'admin'));

CREATE POLICY "bookings_update_dispatcher_admin" ON public.bookings
  FOR UPDATE USING (public.get_current_role() IN ('dispatcher', 'admin'));

CREATE POLICY "bookings_update_driver" ON public.bookings
  FOR UPDATE USING (
    public.get_current_role() = 'driver' AND
    driver_id = public.get_current_driver_id()
  );

-- Satisfaction score update (javno - single-use token)
CREATE POLICY "bookings_update_satisfaction_token" ON public.bookings
  FOR UPDATE
  USING (satisfaction_token IS NOT NULL)
  WITH CHECK (
    satisfaction_score IS NOT NULL AND
    satisfaction_token IS NOT NULL
  );

-- ── SATISFACTION SURVEYS ──────────────────────────────────
CREATE POLICY "satisfaction_select_dispatcher_admin" ON public.satisfaction_surveys
  FOR SELECT USING (public.get_current_role() IN ('dispatcher', 'admin'));

-- ── GPS EVENTS ────────────────────────────────────────────
CREATE POLICY "gps_insert_driver" ON public.gps_events
  FOR INSERT WITH CHECK (
    public.get_current_role() = 'driver' AND
    driver_id = public.get_current_driver_id()
  );

CREATE POLICY "gps_select_admin" ON public.gps_events
  FOR SELECT USING (public.get_current_role() = 'admin');

-- ── WHATSAPP LOGS ─────────────────────────────────────────
CREATE POLICY "whatsapp_select_admin" ON public.whatsapp_logs
  FOR SELECT USING (public.get_current_role() = 'admin');

-- ── AUDIT LOGS ────────────────────────────────────────────
CREATE POLICY "audit_select_admin" ON public.audit_logs
  FOR SELECT USING (public.get_current_role() = 'admin');

CREATE POLICY "audit_insert_authenticated" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

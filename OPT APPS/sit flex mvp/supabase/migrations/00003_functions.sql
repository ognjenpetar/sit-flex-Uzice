-- ═══════════════════════════════════════════════════════════
-- calculate_fare
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.calculate_fare(
  p_pickup_stop_id  UUID,
  p_dropoff_stop_id UUID,
  p_tariff_code     TEXT DEFAULT 'T1'
)
RETURNS TABLE (
  distance_km         DECIMAL,
  duration_min        INT,
  tariff_rsd_per_km   DECIMAL,
  tariff_label        TEXT,
  fare_rsd_calculated DECIMAL
) AS $$
DECLARE
  v_distance_km  DECIMAL;
  v_duration_min INT;
  v_rsd_per_km   DECIMAL;
  v_label        TEXT;
  v_settings     JSONB;
BEGIN
  SELECT config INTO v_settings
  FROM public.setting_versions
  WHERE effective_to IS NULL OR effective_to > now()
  ORDER BY effective_from DESC LIMIT 1;

  SELECT sd.distance_km, sd.duration_min
  INTO v_distance_km, v_duration_min
  FROM public.stop_distances sd
  WHERE sd.from_stop_id = p_pickup_stop_id
    AND sd.to_stop_id   = p_dropoff_stop_id;

  IF v_distance_km IS NULL THEN
    RAISE EXCEPTION 'DISTANCE_NOT_CONFIGURED'
      USING DETAIL = 'Distanca između ovih stajališta nije konfigurisana.';
  END IF;

  CASE p_tariff_code
    WHEN 'T1' THEN
      v_rsd_per_km := (v_settings->>'tariff_T1_rsd_per_km')::DECIMAL;
      v_label      := v_settings->>'tariff_T1_label';
    WHEN 'T2' THEN
      v_rsd_per_km := (v_settings->>'tariff_T2_rsd_per_km')::DECIMAL;
      v_label      := v_settings->>'tariff_T2_label';
    WHEN 'T3' THEN
      v_rsd_per_km := (v_settings->>'tariff_T3_rsd_per_km')::DECIMAL;
      v_label      := v_settings->>'tariff_T3_label';
    ELSE
      RAISE EXCEPTION 'INVALID_TARIFF_CODE'
        USING DETAIL = 'Tarifa mora biti T1, T2 ili T3.';
  END CASE;

  RETURN QUERY SELECT
    v_distance_km,
    v_duration_min,
    v_rsd_per_km,
    v_label,
    ROUND(v_distance_km * v_rsd_per_km, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════
-- validate_status_transition
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.validate_status_transition(
  p_from booking_status,
  p_to   booking_status
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN CASE
    WHEN p_from = 'pending'     AND p_to = 'confirmed'   THEN TRUE
    WHEN p_from = 'confirmed'   AND p_to = 'assigned'    THEN TRUE
    WHEN p_from = 'assigned'    AND p_to = 'in_progress' THEN TRUE
    WHEN p_from = 'in_progress' AND p_to = 'completed'   THEN TRUE
    WHEN p_from IN ('pending','confirmed','assigned') AND p_to = 'cancelled' THEN TRUE
    WHEN p_from = 'assigned'    AND p_to = 'no_show'     THEN TRUE
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ═══════════════════════════════════════════════════════════
-- mv_kpi_monthly
-- ═══════════════════════════════════════════════════════════
CREATE MATERIALIZED VIEW public.mv_kpi_monthly AS
SELECT
  DATE_TRUNC('month', b.pickup_time)                              AS month,
  COUNT(*)                                                         AS total_bookings,
  COUNT(*) FILTER (WHERE b.status = 'completed')                  AS completed,
  COUNT(*) FILTER (WHERE b.status = 'cancelled')                  AS cancelled,
  COUNT(*) FILTER (WHERE b.status = 'no_show')                    AS no_shows,
  COUNT(DISTINCT b.passenger_id)                                   AS unique_passengers,
  COUNT(DISTINCT b.pickup_stop_id)                                 AS unique_stops_used,
  AVG(
    EXTRACT(EPOCH FROM (b.actual_pickup_time - b.pickup_time)) / 60
  ) FILTER (WHERE b.actual_pickup_time IS NOT NULL)                AS avg_wait_min,
  ROUND(
    COUNT(*) FILTER (WHERE b.status IN ('cancelled','no_show'))::DECIMAL
    / NULLIF(COUNT(*), 0) * 100, 2
  )                                                                AS cancellation_rate_pct,
  SUM(b.fare_rsd_calculated) FILTER (WHERE b.status = 'completed') AS total_fare_calculated_rsd,
  SUM(b.fare_rsd_passenger)  FILTER (WHERE b.status = 'completed') AS total_collected_rsd,
  SUM(b.fare_rsd_operator)   FILTER (WHERE b.status = 'completed') AS total_owed_operator_rsd,
  SUM(b.subsidy_rsd)         FILTER (WHERE b.status = 'completed') AS total_subsidy_rsd,
  SUM(b.distance_km)         FILTER (WHERE b.status = 'completed') AS total_km,
  AVG(b.distance_km)         FILTER (WHERE b.status = 'completed') AS avg_trip_km,
  COUNT(*) FILTER (WHERE b.tariff_code = 'T1' AND b.status = 'completed') AS trips_T1,
  COUNT(*) FILTER (WHERE b.tariff_code = 'T2' AND b.status = 'completed') AS trips_T2,
  COUNT(*) FILTER (WHERE b.tariff_code = 'T3' AND b.status = 'completed') AS trips_T3,
  COUNT(*) FILTER (WHERE b.subsidy_rsd > 0 AND b.status = 'completed')    AS trips_with_subsidy,
  COUNT(*) FILTER (WHERE b.trip_purpose = 'healthcare')                    AS healthcare_trips,
  COUNT(*) FILTER (
    WHERE p.category IN ('elderly','low_income') OR p.needs_wheelchair = true
  )                                                                AS vulnerable_trips,
  AVG(b.satisfaction_score) FILTER (WHERE b.satisfaction_score IS NOT NULL) AS avg_satisfaction
FROM public.bookings b
JOIN public.passengers p ON b.passenger_id = p.id
GROUP BY DATE_TRUNC('month', b.pickup_time)
WITH DATA;

CREATE UNIQUE INDEX ON public.mv_kpi_monthly (month);

-- pg_cron jobs
SELECT cron.schedule(
  'refresh-kpi-monthly', '0 5 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly'
);

SELECT cron.schedule(
  'satisfaction-survey-queue', '0 * * * *',
  $$
  INSERT INTO public.satisfaction_surveys (booking_id, status)
  SELECT b.id, 'pending'
  FROM public.bookings b
  LEFT JOIN public.satisfaction_surveys ss ON ss.booking_id = b.id
  WHERE b.status = 'completed'
    AND b.satisfaction_score IS NULL
    AND b.actual_dropoff_time < now() - interval '24 hours'
    AND ss.id IS NULL;
  $$
);

SELECT cron.schedule(
  'refresh-no-show-counts', '0 4 * * *',
  $$
  UPDATE public.passengers p
  SET no_show_count_30d = (
    SELECT COUNT(*) FROM public.bookings b
    WHERE b.passenger_id = p.id
      AND b.status = 'no_show'
      AND b.pickup_time > now() - interval '30 days'
  );
  $$
);

SELECT cron.schedule(
  'daily-report-email', '0 19 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/daily-report-email',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || current_setting('app.service_role_key')
    )
  );
  $$
);

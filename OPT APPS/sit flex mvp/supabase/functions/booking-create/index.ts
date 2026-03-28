import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const body = await req.json()
    const {
      service_day_id, passenger_id, pickup_stop_id, dropoff_stop_id,
      pickup_time, trip_purpose, notes, tariff_code = 'T1',
      subsidy_rsd = 0, subsidy_reason,
    } = body

    // Izračunaj cenu pozivom DB funkcije
    const { data: fareData, error: fareError } = await supabase
      .rpc('calculate_fare', {
        p_pickup_stop_id: pickup_stop_id,
        p_dropoff_stop_id: dropoff_stop_id,
        p_tariff_code: tariff_code,
      })

    if (fareError || !fareData?.length) {
      throw new Error(fareError?.message || 'DISTANCE_NOT_CONFIGURED')
    }

    const fare = fareData[0]
    const fareCalc = Number(fare.fare_rsd_calculated)
    const subsidyAmt = Number(subsidy_rsd)

    const booking = {
      service_day_id,
      passenger_id,
      pickup_stop_id,
      dropoff_stop_id,
      pickup_time,
      trip_purpose: trip_purpose || 'other',
      notes: notes || null,
      status: 'pending' as const,
      tariff_code,
      tariff_rsd_per_km: Number(fare.tariff_rsd_per_km),
      distance_km: Number(fare.distance_km),
      duration_min_estimated: fare.duration_min,
      fare_rsd_calculated: fareCalc,
      subsidy_rsd: subsidyAmt,
      subsidy_reason: subsidy_reason || null,
      fare_rsd_passenger: fareCalc - subsidyAmt,
      fare_rsd_operator: fareCalc,
      created_by: user.id,
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single()

    if (error) throw error

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'CREATE',
      entity_type: 'booking',
      entity_id: data.id,
      new_value: booking,
    })

    return new Response(JSON.stringify({ success: true, booking: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

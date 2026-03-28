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
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { serviceDate } = await req.json()

    // Fetch unassigned confirmed bookings for the day
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, passenger:passengers(needs_wheelchair)')
      .gte('pickup_time', `${serviceDate}T00:00:00`)
      .lte('pickup_time', `${serviceDate}T23:59:59`)
      .eq('status', 'confirmed')
      .is('driver_id', null)
      .order('pickup_time')

    if (!bookings?.length) {
      return new Response(JSON.stringify({ assigned: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch available drivers with their vehicles
    const { data: drivers } = await supabase
      .from('drivers')
      .select('*, vehicle:vehicles(id, has_wheelchair_access, capacity_passengers)')
      .eq('is_available', true)
      .eq('is_active', true)
      .not('vehicle_id', 'is', null)

    if (!drivers?.length) {
      return new Response(JSON.stringify({ assigned: 0, reason: 'No available drivers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let assigned = 0

    // Simple assignment: wheelchair-accessible bookings get accessible vehicles first
    for (const booking of bookings) {
      const needsWheelchair = (booking.passenger as any)?.needs_wheelchair

      const eligibleDriver = drivers.find((d: any) => {
        if (needsWheelchair && !d.vehicle?.has_wheelchair_access) return false
        return true
      })

      if (eligibleDriver) {
        const { error } = await supabase
          .from('bookings')
          .update({
            driver_id: eligibleDriver.id,
            vehicle_id: eligibleDriver.vehicle_id,
            status: 'assigned',
          })
          .eq('id', booking.id)

        if (!error) {
          assigned++
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            action: 'AUTO_ASSIGN',
            entity_type: 'booking',
            entity_id: booking.id,
            new_value: { driver_id: eligibleDriver.id, vehicle_id: eligibleDriver.vehicle_id },
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, assigned }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

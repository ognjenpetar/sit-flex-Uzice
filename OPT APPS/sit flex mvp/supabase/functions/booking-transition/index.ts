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

    const { bookingId, toStatus, reason, driver_id, vehicle_id } = await req.json()

    // Fetch current booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
    if (fetchError || !booking) throw new Error('Booking not found')

    // Validate transition
    const { data: valid } = await supabase.rpc('validate_status_transition', {
      p_from: booking.status,
      p_to: toStatus,
    })
    if (!valid) throw new Error(`Invalid transition: ${booking.status} → ${toStatus}`)

    const updates: Record<string, unknown> = { status: toStatus }
    if (toStatus === 'assigned' && driver_id) {
      updates.driver_id = driver_id
      if (vehicle_id) updates.vehicle_id = vehicle_id
    }
    if (toStatus === 'in_progress') updates.actual_pickup_time = new Date().toISOString()
    if (toStatus === 'completed') updates.actual_dropoff_time = new Date().toISOString()
    if (toStatus === 'cancelled') {
      updates.cancelled_by = user.id
      updates.cancelled_reason = reason || null
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single()
    if (error) throw error

    // Audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: `STATUS_TRANSITION:${booking.status}→${toStatus}`,
      entity_type: 'booking',
      entity_id: bookingId,
      old_value: { status: booking.status },
      new_value: { status: toStatus },
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

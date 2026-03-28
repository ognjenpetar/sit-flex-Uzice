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

    const { token } = await req.json()
    if (!token) throw new Error('Token required')

    const { data: qrToken, error } = await supabase
      .from('driver_qr_tokens')
      .select('*, driver:drivers(profile_id)')
      .eq('token', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !qrToken) throw new Error('Invalid or expired token')

    // Update last_used_at
    await supabase
      .from('driver_qr_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', qrToken.id)

    return new Response(JSON.stringify({ success: true, profile_id: qrToken.driver.profile_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

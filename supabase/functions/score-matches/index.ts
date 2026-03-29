import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { route } = await req.json()

    // Query pending shipments where distance is within 100km (100000 meters) of driver's route destination
    // PostGIS function ST_DWithin used in Supabase via RPC
    const { data: matchedShipments, error } = await supabaseClient.rpc('find_matches', {
      driver_dst: route.destination_location,
      radius_meters: 100000
    })

    if (error) throw error

    // Example scoring logic
    const scores = matchedShipments.map((s: any) => {
      // Basic scoring formula
      const score = Math.max(0, 100 - (s.distance_meters / 1000))
      return {
        route_id: route.id,
        shipment_id: s.id,
        match_score: score.toFixed(1),
        detour_km: (s.distance_meters / 1000).toFixed(1),
        status: 'suggested'
      }
    })

    // Insert new matches
    if (scores.length > 0) {
      const { error: insertError } = await supabaseClient.from('matches').insert(scores)
      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ matchesFound: scores.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

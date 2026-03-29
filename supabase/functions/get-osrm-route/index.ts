import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { crypto } from "https://deno.land/std@0.192.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.192.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { fromCoord, toCoord } = body;

    if (!fromCoord || !toCoord) {
      return new Response(JSON.stringify({ error: 'Missing fromCoord or toCoord' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Generate URL hash for caching
    const url = `https://router.project-osrm.org/route/v1/driving/${fromCoord.lng},${fromCoord.lat};${toCoord.lng},${toCoord.lat}?overview=full&geometries=geojson`;
    
    const messageBuffer = new TextEncoder().encode(url);
    const hashBuffer = await crypto.subtle.digest('SHA-256', messageBuffer);
    const urlHash = encodeHex(hashBuffer);

    // 2. Init Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role to bypass RLS for caching
    );

    // 3. Check Cache
    const { data: cacheData, error: cacheError } = await supabaseClient
      .from('route_cache')
      .select('route_data')
      .eq('url_hash', urlHash)
      .maybeSingle();

    if (cacheData?.route_data) {
      console.log('Cache Hit:', urlHash);
      return new Response(JSON.stringify(cacheData.route_data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Cache Miss, Fetch from OSRM
    console.log('Cache Miss, Fetching OSRM:', urlHash);
    const osrmRes = await fetch(url);
    const osrmJson = await osrmRes.json();

    if (osrmJson.code !== 'Ok' || !osrmJson.routes?.[0]) {
      throw new Error('OSRM API returned error or no route.');
    }

    const routeData = {
      coords: osrmJson.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
      dist: (osrmJson.routes[0].distance / 1000).toFixed(1),
      mins: Math.round(osrmJson.routes[0].duration / 60)
    };

    // 5. Store in Cache
    await supabaseClient
      .from('route_cache')
      .insert({ url_hash: urlHash, route_data: routeData })
      .select()
      .single();

    // 6. Return response
    return new Response(JSON.stringify(routeData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

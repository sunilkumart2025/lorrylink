import { supabase } from '../supabase';

/**
 * Fetch AI-suggested matches for a specific route (for a driver).
 * @param {string} routeId
 */
export async function getMatchesForRoute(routeId) {
  return supabase
    .from('matches')
    .select(`
      id,
      match_score,
      detour_distance_km,
      estimated_profit,
      status,
      created_at,
      shipments (
        id, pickup_address, drop_address,
        weight_kg, volume, price, is_partial, status,
        business:profiles!shipments_business_id_fkey ( name, phone )
      )
    `)
    .eq('route_id', routeId)
    .eq('status', 'suggested')
    .order('match_score', { ascending: false });
}

/**
 * Fetch all suggested matches globally (for the open loads feed when no route posted yet).
 */
export async function getAllSuggestedMatches() {
  return supabase
    .from('matches')
    .select(`
      id,
      match_score,
      detour_distance_km,
      estimated_profit,
      status,
      created_at,
      shipments (
        id, pickup_address, drop_address,
        weight_kg, volume, price, is_partial, status
      )
    `)
    .eq('status', 'suggested')
    .order('match_score', { ascending: false })
    .limit(20);
}

/**
 * Accept a match.
 * @param {string} matchId
 */
export async function acceptMatch(matchId) {
  return supabase
    .from('matches')
    .update({ status: 'accepted' })
    .eq('id', matchId)
    .select()
    .single();
}

/**
 * Reject a match.
 * @param {string} matchId
 */
export async function rejectMatch(matchId) {
  return supabase
    .from('matches')
    .update({ status: 'rejected' })
    .eq('id', matchId)
    .select()
    .single();
}

/**
 * Trigger the server-side find_matches() DB function.
 */
export async function triggerMatchFinding() {
  return supabase.rpc('find_matches');
}

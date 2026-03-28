import { supabase } from '../supabase';

/**
 * @typedef {Object} RouteInsert
 * @property {string} truck_id
 * @property {string} origin
 * @property {string} destination
 * @property {string} origin_location - WKT POINT
 * @property {string} destination_location - WKT POINT
 * @property {string} departure_time
 * @property {string} expected_arrival
 * @property {boolean} is_return_trip
 * @property {number} available_capacity_kg
 * @property {number} available_volume
 * @property {string} status
 */

/**
 * Create a new route
 * @param {RouteInsert} payload 
 */
export async function createRoute(payload) {
  return supabase.from('routes').insert(payload).select().single();
}

/**
 * Get active route for a driver
 * @param {string} driverId 
 */
export async function getActiveRouteForDriver(driverId) {
  return supabase
    .from('routes')
    .select('*, trucks!inner(driver_id)')
    .eq('trucks.driver_id', driverId)
    .eq('status', 'active')
    .maybeSingle();
}

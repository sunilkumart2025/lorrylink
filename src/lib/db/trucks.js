import { supabase } from '../supabase';

/**
 * @typedef {Object} TruckInsert
 * @property {string} driver_id
 * @property {string} vehicle_number
 * @property {string} vehicle_type
 * @property {number} capacity_kg
 * @property {number} capacity_volume
 * @property {boolean} ulip_verified
 */

/**
 * Register a new truck
 * @param {TruckInsert} payload 
 */
export async function registerTruck(payload) {
  return supabase.from('trucks').insert(payload).select().single();
}

/**
 * Get trucks for a driver
 * @param {string} driverId 
 */
export async function getTrucksForDriver(driverId) {
  return supabase
    .from('trucks')
    .select('*')
    .eq('driver_id', driverId);
}

import { supabase } from '../supabase';

/**
 * Push real-time location.
 * @param {string} bookingId 
 * @param {{lat: number, lng: number}} coords 
 * @param {number} speed 
 */
export async function pushLocation(bookingId, coords, speed) {
  return supabase.from('tracking').insert({
    booking_id: bookingId,
    location: `POINT(${coords.lng} ${coords.lat})`,
    speed,
    recorded_at: new Date().toISOString()
  });
}

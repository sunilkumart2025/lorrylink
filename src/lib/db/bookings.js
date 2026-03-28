import { supabase } from '../supabase';

/**
 * Create a booking.
 * Schema: shipment_id, route_id, driver_id, business_id, agreed_price, status
 * @param {Object} payload
 */
export async function createBooking(payload) {
  return supabase
    .from('bookings')
    .insert(payload)
    .select()
    .single();
}

/**
 * Get all bookings for a user (driver or business).
 * Joins shipments and routes for full context.
 * @param {string} userId
 * @param {'driver' | 'business'} role
 */
export async function getBookingsForUser(userId, role) {
  const col = role === 'driver' ? 'driver_id' : 'business_id';
  return supabase
    .from('bookings')
    .select(`
      *,
      shipments ( id, pickup_address, drop_address, weight_kg, price, status ),
      routes ( id, origin, destination, departure_time, expected_arrival )
    `)
    .eq(col, userId)
    .order('created_at', { ascending: false });
}

/**
 * Get a single booking with all relations.
 * @param {string} bookingId
 */
export async function getBookingById(bookingId) {
  return supabase
    .from('bookings')
    .select(`
      *,
      shipments ( id, pickup_address, drop_address, weight_kg, price, status ),
      driver:profiles!bookings_driver_id_fkey ( id, name, email ),
      business:profiles!bookings_business_id_fkey ( id, name, email )
    `)
    .eq('id', bookingId)
    .single();
}

/**
 * Update booking status.
 * @param {string} bookingId
 * @param {string} status - 'requested' | 'confirmed' | 'in_transit' | 'completed' | 'cancelled'
 */
export async function updateBookingStatus(bookingId, status) {
  return supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();
}

/**
 * @deprecated use updateBookingStatus instead
 */
export async function completeBooking(bookingId) {
  return updateBookingStatus(bookingId, 'completed');
}

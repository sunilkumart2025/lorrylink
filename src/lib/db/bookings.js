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
/**
 * Upload loading or delivery proof.
 * @param {string} bookingId
 * @param {'loading' | 'delivery'} type
 * @param {File} file
 * @param {string} userId
 */
export async function uploadBookingProof(bookingId, type, file, userId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${bookingId}_${type}_${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('booking-verifications')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('booking-verifications')
    .getPublicUrl(filePath);

  const updateData = type === 'loading' ? {
    loading_proof_url: publicUrl,
    loading_proof_status: 'pending',
    loading_proof_uploaded_at: new Date().toISOString()
  } : {
    delivery_proof_url: publicUrl,
    delivery_proof_status: 'pending',
    delivery_proof_uploaded_at: new Date().toISOString()
  };

  // If this is loading proof, we also update the main status to in_transit?
  // User didn't specify, but usually loading proof is what triggers in_transit.
  // I'll stick to just updating the proof status as requested.

  return supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single();
}

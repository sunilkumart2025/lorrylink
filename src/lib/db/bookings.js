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
export async function uploadBookingProof(bookingId, type, file, userId) {
  // 1. Generate a mock public URL
  const mockUrl = `https://images.unsplash.com/photo-1586191582056-b15cd3db3d94?q=80&w=500&auto=format&fit=crop`;

  const updateData = type === 'loading' ? {
    loading_proof_url: mockUrl,
    loading_proof_status: 'pending',
    loading_proof_uploaded_at: new Date().toISOString()
  } : {
    delivery_proof_url: mockUrl,
    delivery_proof_status: 'pending',
    delivery_proof_uploaded_at: new Date().toISOString()
  };

  // 2. Perform initial update to 'pending'
  const { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;

  // 3. Trigger asynchronous mock background verification (3s delay)
  setTimeout(async () => {
    const finalUpdate = type === 'loading' ? {
      loading_proof_status: 'accepted',
      current_milestone: 'loaded',
      status: 'in_progress'
    } : {
      delivery_proof_status: 'accepted',
      current_milestone: 'delivered',
      status: 'completed'
    };

    await supabase
      .from('bookings')
      .update(finalUpdate)
      .eq('id', bookingId);
  }, 3000);

  return updatedBooking;
}

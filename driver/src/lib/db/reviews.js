import { supabase } from '../supabase';

/**
 * Fetch recent public reviews (for Home page social proof).
 * @param {number} limit
 */
export async function getRecentReviews(limit = 5) {
  return supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      bookings (
        driver:profiles!bookings_driver_id_fkey ( name ),
        business:profiles!bookings_business_id_fkey ( name )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
}

/**
 * Fetch all reviews for a specific driver.
 * @param {string} driverId
 */
export async function getReviewsForDriver(driverId) {
  return supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      bookings!inner (
        driver_id
      )
    `)
    .eq('bookings.driver_id', driverId)
    .order('created_at', { ascending: false });
}

/**
 * Submit a review for a completed booking.
 * @param {string} bookingId
 * @param {number} rating  - 1 to 5
 * @param {string} comment
 */
export async function submitReview(bookingId, rating, comment) {
  return supabase
    .from('reviews')
    .insert({ booking_id: bookingId, rating, comment })
    .select()
    .single();
}

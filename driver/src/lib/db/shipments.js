import { supabase } from '../supabase';

/**
 * Fetch all pending shipments (public feed for drivers).
 */
export async function getOpenShipments() {
  return supabase
    .from('shipments')
    .select('id, business_id, pickup_address, drop_address, weight_kg, is_partial, price, status')
    .eq('status', 'pending');
}

/**
 * Fetch a single shipment by ID.
 * @param {string} id
 */
export async function getShipmentById(id) {
  return supabase
    .from('shipments')
    .select('*')
    .eq('id', id)
    .single();
}

/**
 * Fetch all shipments posted by a business.
 * @param {string} businessId
 */
export async function getShipmentsByBusiness(businessId) {
  return supabase
    .from('shipments')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
}

/**
 * Insert a new shipment.
 * Schema: business_id, pickup_location (geography), drop_location (geography),
 *         pickup_address, drop_address, weight_kg, volume, is_partial, price, status
 * @param {Object} payload
 */
export async function postShipment(payload) {
  return supabase
    .from('shipments')
    .insert(payload)
    .select()
    .single();
}

/**
 * Update shipment status.
 * @param {string} id
 * @param {string} status - 'pending' | 'matched' | 'in_transit' | 'delivered' | 'cancelled'
 */
export async function updateShipmentStatus(id, status) {
  return supabase
    .from('shipments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
}

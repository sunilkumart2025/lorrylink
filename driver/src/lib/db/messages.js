import { supabase } from '../supabase';

/**
 * Sends a message between a driver and a shipper.
 * Supports specialized type='offer' for price negotiation.
 */
export const sendMessage = async ({ shipment_id, sender_id, receiver_id, content, type = 'text', metadata = {} }) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      { shipment_id, sender_id, receiver_id, content, type, metadata }
    ])
    .select()
    .single();

  return { data, error };
};

/**
 * Fetches the message history for a specific shipment context.
 */
export const getMessageHistory = async (shipment_id) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('shipment_id', shipment_id)
    .order('created_at', { ascending: true });

  return { data, error };
};

/**
 * Marks messages as read for a session.
 */
export const markAsRead = async (messageIds) => {
  if (!messageIds || messageIds.length === 0) return;
  
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .in('id', messageIds);

  return { error };
};

import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getMessageHistory, markAsRead } from '../lib/db/messages';

/**
 * useChat Hook: Manages real-time negotiation messages for a shipment.
 * Automatic synchronization with Supabase Realtime + React Query cache.
 */
export const useChat = (shipmentId, currentUserId) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['messages', shipmentId], [shipmentId]);

  // 1. Initial Fetch of History
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getMessageHistory(shipmentId).then(res => {
      if (res.error) throw res.error;
      return res.data || [];
    }),
    staleTime: 1000 * 30, // 30 seconds
    enabled: !!shipmentId,
  });

  // 2. Real-time Subscription
  useEffect(() => {
    if (!shipmentId) return;

    const channel = supabase
      .channel(`chat_${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `shipment_id=eq.${shipmentId}`,
        },
        (payload) => {
          queryClient.setQueryData(queryKey, (old = []) => [...(Array.isArray(old) ? old : []), payload.new]);
          
          if (payload.new.receiver_id === currentUserId) {
            markAsRead([payload.new.id]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId, currentUserId, queryClient, queryKey]);

  return { messages, isLoading, error };
};

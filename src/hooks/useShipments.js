import { useQuery } from '@tanstack/react-query';
import { useRealtimeSync } from './useRealtimeSync';
import { supabase } from '../lib/supabase';

/**
 * Hook: fetch ALL shipments from Supabase immediately.
 * No filters, no RPC, no limits. Just the raw data to prove it works.
 */
export const useShipments = () => {
  // Subscribe to realtime to ensure UI stays updated
  useRealtimeSync('shipments', 'shipments');

  return useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      console.log('--- FORCED ALL FETCH START ---');
      
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error.message);
        throw new Error(error.message);
      }

      console.log(`Successfully fetched ${data?.length || 0} shipments.`);

      // Map it for the UI
      return (data || []).map(s => ({
        ...s,
        origin: s.pickup_address?.split(',')[0]?.trim() || 'Origin',
        destination: s.drop_address?.split(',')[0]?.trim() || 'Destination',
        weight: (s.weight_kg || 0) / 1000,
        gross_rate: s.price || 0,
        requirements: s.is_partial ? 'Part Load' : 'Full Load',
        distance_home_km: s.distance_home_km || undefined
      }));
    },
    staleTime: 5000, 
  });
};

/**
 * AI Matches hook (for other flows)
 */
export const useMatches = (routeId) => {
  return useQuery({
    queryKey: ['matches', routeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*, shipments(*)')
        .eq('status', 'suggested');
      if (error) throw error;
      return data || [];
    }
  });
};

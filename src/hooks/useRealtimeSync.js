import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useRealtimeSync = (table, queryKey, filter = null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let channelConfig = {
      event: '*',
      schema: 'public',
      table
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(`realtime_${table}_${queryKey}_${filter || 'all'}`)
      .on('postgres_changes', channelConfig, (payload) => {
        // Invalidate specific react-query cache
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        
        // Also try to invalidate if queryKey is the first element of an array
        queryClient.invalidateQueries({ predicate: query => query.queryKey[0] === queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKey, filter, queryClient]);
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useReviews = (bookingId) => {
  const queryClient = useQueryClient();

  // Fetch reviews for a specific booking
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId);
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId
  });

  // Submit a new review
  const submitReview = useMutation({
    mutationFn: async ({ rating, comment }) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{ booking_id: bookingId, rating, comment }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', bookingId] });
    }
  });

  return { reviews, isLoading, submitReview };
};

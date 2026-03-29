import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useFinancials = () => {
  return useQuery({
    queryKey: ['financials'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { balance: 0, transactions: [] };

      // Fetch bookings associated with this driver to calculate payout
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          shipments (pickup_address, drop_address)
        `)
        .eq('driver_id', user.id)
        .eq('status', 'completed');

      if (error) throw new Error(error.message);

      // Fetch actual payment records
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      const totalEarnings = bookings.reduce((acc, b) => acc + (b.agreed_price || 0), 0);
      const totalPaid = (payments || []).reduce((acc, p) => acc + (p.amount || 0), 0);

      return {
        balance: totalEarnings - totalPaid,
        transactions: (payments || []).map(p => ({
          id: p.id,
          type: p.payment_status === 'paid' ? 'Payout' : 'Pending',
          amount: p.amount,
          date: new Date(p.created_at).toLocaleDateString()
        }))
      };
    }
  });
};

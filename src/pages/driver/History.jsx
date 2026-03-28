import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { 
  Package, Calendar, CheckCircle2, XCircle, 
  MapPin, IndianRupee, Truck
} from 'lucide-react';

export default function History() {
  const { user } = useStore();

  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ['driver-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, agreed_price, created_at,
          shipments ( pickup_address, drop_address, weight_kg )
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id
  });

  const totalEarned = history
    .filter(h => h.status === 'completed')
    .reduce((acc, curr) => acc + (curr.agreed_price || 0), 0);

  const completedCount = history.filter(h => h.status === 'completed').length;

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'white', margin: 0 }}>Earnings & History</h1>
        
        {/* Earnings Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,211,238,0.05))',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '16px', padding: '16px', marginTop: '10px'
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Earned</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '28px', fontWeight: '900', color: 'var(--color-success)', marginTop: '4px' }}>
            <IndianRupee size={22} strokeWidth={3} /> {totalEarned.toLocaleString('en-IN')}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
               <CheckCircle2 size={14} color="var(--color-success)" /> {completedCount} Completed
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
               <Truck size={14} color="var(--color-primary)" /> {history.length} Total Loads
             </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {isLoading && <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Loading history...</p>}
        {error && <p style={{ color: 'var(--color-error)' }}>Failed to load history.</p>}

        {!isLoading && history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--glass-bg)', borderRadius: '16px' }}>
            <Calendar size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '8px' }}>No history yet</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Your completed trips will appear here.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item, idx) => {
            const isCompleted = item.status === 'completed';
            const isCancelled = item.status === 'cancelled';
            const isPending = !isCompleted && !isCancelled;

            const s = item.shipments;
            
            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="card-glass"
                style={{
                  padding: '16px',
                  borderLeft: isCompleted ? '3px solid var(--color-success)' : isCancelled ? '3px solid var(--color-error)' : '3px solid var(--color-warning)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', 
                       color: isCompleted ? 'var(--color-success)' : isCancelled ? 'var(--color-error)' : 'var(--color-warning)', textTransform: 'uppercase' }}>
                    {isCompleted ? <CheckCircle2 size={14} /> : isCancelled ? <XCircle size={14} /> : <Clock size={14} />}
                    {item.status}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                   <div>
                     <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                       <MapPin size={12} color="var(--color-primary)" />
                       <span style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>{s?.pickup_address?.split(',')[0]}</span>
                     </div>
                     <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                       <MapPin size={12} color="var(--color-success)" />
                       <span style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>{s?.drop_address?.split(',')[0]}</span>
                     </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: isCancelled ? 'rgba(255,255,255,0.3)' : 'var(--color-success)' }}>
                        ₹{item.agreed_price?.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                        {(s?.weight_kg || 0) / 1000} Tons
                      </div>
                   </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

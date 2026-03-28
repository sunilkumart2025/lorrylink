import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Truck, CheckCircle, MapPin, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { findShipmentChains } from '../../lib/routing';
import { supabase } from '../../lib/supabase';
import RoutePreviewMap from '../../components/maps/RoutePreviewMap';

export default function ComboTrips() {
  const { user } = useStore();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['shipments-combo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'pending');
      if (error) throw error;
      return data;
    }
  });

  const combos = shipments ? findShipmentChains(shipments, user?.home_city) : [];

  return (
    <div style={{ padding: 'var(--spacing-md)', paddingBottom: '80px' }}>
      <header className="mb-xl">
        <h1 style={{ color: 'var(--color-primary)', fontSize: '24px', fontWeight: '900' }}>BUILD MY TRIP</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Smart Chaining Engine (Pillar 4.2)</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center p-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="flex-col gap-lg">
          {combos.length === 0 && (
            <div className="card-glass text-center p-xl">
               <Truck size={48} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 15px' }} />
               <p>No profitable combos found for your current route yet.</p>
            </div>
          )}

          {combos.map((combo, idx) => (
            <motion.div 
              key={combo.id} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card-glass" 
              style={{ padding: '24px', marginBottom: '20px' }}
            >
              <div className="flex justify-between items-center mb-lg">
                 <div style={{ 
                   fontSize: '11px', 
                   fontWeight: '900', 
                   padding: '4px 12px', 
                   backgroundColor: 'rgba(29, 233, 182, 0.1)', 
                   color: 'var(--color-primary)', 
                   borderRadius: '20px',
                   letterSpacing: '1px'
                 }}>
                   {combo.efficiency} COMBO
                 </div>
                 <TrendingUp size={20} color="var(--color-primary)" />
              </div>

              <div style={{ height: '180px', marginBottom: '20px', borderRadius: '16px', overflow: 'hidden' }}>
                <RoutePreviewMap legs={combo.legs} />
              </div>

              <div className="flex-col gap-md mb-lg">
                {combo.legs.map((leg, lIdx) => (
                  <div key={lIdx} className="flex items-center gap-md">
                    <div className="flex-col items-center">
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></div>
                      {lIdx < combo.legs.length - 1 && <div style={{ width: '2px', height: '30px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>}
                    </div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Leg {lIdx + 1}</div>
                       <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{leg.from} <ChevronRight size={14} style={{ margin: '0 4px' }} /> {leg.to}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontWeight: '900', color: 'var(--color-primary)' }}>₹{leg.earning.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <div className="flex justify-between mb-xs">
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Total Est. Revenue</span>
                    <span style={{ fontWeight: '900', color: 'var(--color-success)', fontSize: '18px' }}>₹{combo.totalEarning.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between">
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>vs Direct Route</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>₹{(combo.totalEarning * 0.75).toLocaleString()}</span>
                 </div>
              </div>

              <button className="btn btn-primary btn-block mt-lg" style={{ height: '56px', borderRadius: '16px', boxShadow: '0 10px 20px rgba(0, 191, 165, 0.2)' }}>
                ACCEPT COMBINED TRIP <CheckCircle size={20} style={{ marginLeft: '10px' }} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

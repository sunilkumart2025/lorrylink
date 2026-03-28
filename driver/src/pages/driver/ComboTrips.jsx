import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, TrendingUp, Truck } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { findShipmentChains } from '../../lib/routing';
import { supabase } from '../../lib/supabase';
import RoutePreviewMap from '../../components/maps/RoutePreviewMap';

export default function ComboTrips() {
  const { user } = useStore();
  const navigate = useNavigate();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['shipments-combo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shipments').select('*').eq('status', 'pending');
      if (error) throw error;
      return data;
    },
  });

  const combos = shipments ? findShipmentChains(shipments, user?.home_city) : [];

  return (
    <div className="app-page">
      <div className="card-glass app-surface-hero" style={{ marginBottom: '20px' }}>
        <div className="app-surface-kicker">
          <TrendingUp size={14} />
          Combo Planning
        </div>
        <h1 className="app-surface-title">Multi-leg chains with a cleaner planning view</h1>
        <p className="app-surface-copy">
          Route chaining now reads like a premium planning surface, with each leg, projected revenue, and review action sized for faster comparison.
        </p>
      </div>

      {isLoading ? (
        <div className="card-glass app-empty-card">
          <div className="loader-pulse"></div>
          <p style={{ marginTop: '14px', color: 'var(--color-text-muted)' }}>Building profitable trip chains...</p>
        </div>
      ) : (
        <div className="app-stacked-list">
          {combos.length === 0 && (
            <div className="card-glass app-empty-card">
              <Truck size={44} color="var(--color-text-muted)" style={{ opacity: 0.16, marginBottom: '12px' }} />
              <h3 style={{ color: 'var(--color-text-primary)' }}>No profitable combos found</h3>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '6px' }}>
                New chain opportunities will appear here when the route graph improves.
              </p>
            </div>
          )}

          {combos.map((combo, index) => (
            <motion.div
              key={combo.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-glass app-data-card"
            >
              <div className="app-list-row" style={{ marginBottom: '18px' }}>
                <div className="app-list-main">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(59,130,246,0.12)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <TrendingUp size={18} />
                  </div>
                  <div className="app-list-copy">
                    <div className="app-list-title">{combo.efficiency} combo route</div>
                    <div className="app-list-subtitle">{combo.legs.length} freight legs chained together</div>
                  </div>
                </div>
                <div className="badge badge-success" style={{ padding: '8px 14px' }}>
                  ₹{combo.totalEarning.toLocaleString()}
                </div>
              </div>

              <div style={{ height: '220px', marginBottom: '18px', borderRadius: '24px', overflow: 'hidden' }}>
                <RoutePreviewMap legs={combo.legs} />
              </div>

              <div className="app-stacked-list" style={{ gap: '10px', marginBottom: '18px' }}>
                {combo.legs.map((leg, legIndex) => (
                  <div key={`${combo.id}-${legIndex}`} className="card-glass app-list-card tight">
                    <div className="app-list-row">
                      <div className="app-list-main">
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(59,130,246,0.12)',
                            color: 'var(--color-primary)',
                            fontSize: '12px',
                            fontWeight: '900',
                          }}
                        >
                          {legIndex + 1}
                        </div>
                        <div className="app-list-copy">
                          <div className="app-list-title" style={{ fontSize: '14px' }}>
                            {leg.from} <ChevronRight size={14} style={{ verticalAlign: 'middle' }} /> {leg.to}
                          </div>
                          <div className="app-list-subtitle">Leg {legIndex + 1}</div>
                        </div>
                      </div>
                      <div className="app-list-value" style={{ color: 'var(--color-success)' }}>
                        ₹{leg.earning.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="app-info-row">
                <div className="app-note-surface" style={{ flex: 1 }}>
                  <strong>Total est. revenue:</strong> ₹{combo.totalEarning.toLocaleString()}
                </div>
                <div className="app-note-surface" style={{ flex: 1 }}>
                  <strong>Direct route baseline:</strong> ₹{Math.round(combo.totalEarning * 0.75).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => navigate('/driver/matches')}
                className="app-button is-primary is-block"
                style={{ marginTop: '20px', minHeight: '58px' }}
              >
                <CheckCircle size={18} /> Review in freight market
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <style>{`
        .loader-pulse {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid var(--color-primary);
          border-top-color: transparent;
          animation: combo-spin 0.8s linear infinite;
        }

        @keyframes combo-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

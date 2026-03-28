import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import {
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Truck,
  XCircle,
} from 'lucide-react';

export default function History() {
  const { user } = useStore();

  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ['driver-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error: queryError } = await supabase
        .from('bookings')
        .select(`
          id, status, agreed_price, created_at,
          shipments ( pickup_address, drop_address, weight_kg )
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) throw new Error(queryError.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const totalEarned = history
    .filter((item) => item.status === 'completed')
    .reduce((sum, item) => sum + (item.agreed_price || 0), 0);

  const completedCount = history.filter((item) => item.status === 'completed').length;

  return (
    <div className="app-page app-page-narrow">
      <div className="card-glass app-surface-hero" style={{ marginBottom: '20px' }}>
        <div className="app-surface-kicker">
          <Calendar size={14} />
          Trip Ledger
        </div>
        <h1 className="app-surface-title">Earnings and completed freight history</h1>
        <p className="app-surface-copy">
          A quieter ledger for load revenue, route history, and trip outcomes without losing the operational detail.
        </p>

        <div className="app-inline-stat-grid" style={{ marginTop: '22px' }}>
          <div className="app-inline-stat">
            <span>Total earned</span>
            <strong>₹{totalEarned.toLocaleString('en-IN')}</strong>
          </div>
          <div className="app-inline-stat">
            <span>Completed loads</span>
            <strong>{completedCount}</strong>
          </div>
          <div className="app-inline-stat">
            <span>Total records</span>
            <strong>{history.length}</strong>
          </div>
        </div>
      </div>

      <div className="app-page-header" style={{ marginBottom: '14px' }}>
        <div className="app-title-wrap">
          <h2 className="app-page-title" style={{ fontSize: '1.45rem' }}>Trip Activity</h2>
          <p className="app-page-subtitle">Each row keeps route, amount, and final state readable at a glance.</p>
        </div>
      </div>

      {isLoading && (
        <div className="card-glass app-empty-card">
          <div className="loader-pulse"></div>
          <p style={{ marginTop: '14px', color: 'var(--color-text-muted)' }}>Loading trip history...</p>
        </div>
      )}

      {error && (
        <div className="card-glass app-empty-card" style={{ borderColor: 'rgba(239, 68, 68, 0.18)' }}>
          <p style={{ color: 'var(--color-error)', fontWeight: '800' }}>Failed to load history.</p>
        </div>
      )}

      {!isLoading && !error && history.length === 0 && (
        <div className="card-glass app-empty-card">
          <Truck size={42} color="var(--color-text-muted)" style={{ opacity: 0.18, marginBottom: '14px' }} />
          <h3 style={{ color: 'var(--color-text-primary)', fontSize: '18px' }}>No trip history yet</h3>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '6px' }}>Completed and cancelled loads will collect here.</p>
        </div>
      )}

      <div className="app-stacked-list">
        {history.map((item, index) => {
          const shipment = item.shipments;
          const isCompleted = item.status === 'completed';
          const isCancelled = item.status === 'cancelled';
          const statusColor = isCompleted
            ? 'var(--color-success)'
            : isCancelled
              ? 'var(--color-error)'
              : 'var(--color-warning)';
          const StatusIcon = isCompleted ? CheckCircle2 : isCancelled ? XCircle : Clock;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="card-glass app-list-card"
              style={{ borderLeft: `3px solid ${statusColor}` }}
            >
              <div className="app-list-row">
                <div className="app-list-main">
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isCompleted
                        ? 'rgba(34,197,94,0.12)'
                        : isCancelled
                          ? 'rgba(239,68,68,0.12)'
                          : 'rgba(245,158,11,0.12)',
                      color: statusColor,
                    }}
                  >
                    <StatusIcon size={18} />
                  </div>
                  <div className="app-list-copy">
                    <div className="app-list-title" style={{ textTransform: 'capitalize' }}>
                      {item.status.replace('_', ' ')}
                    </div>
                    <div className="app-list-subtitle">
                      {new Date(item.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <div className="app-list-value" style={{ color: isCancelled ? 'var(--color-text-primary)' : 'var(--color-success)' }}>
                  ₹{item.agreed_price?.toLocaleString('en-IN') || '0'}
                </div>
              </div>

              <div className="app-panel-grid two-up">
                <div className="app-route-metric">
                  <span>Pickup</span>
                  <strong style={{ fontSize: '22px' }}>{shipment?.pickup_address?.split(',')[0] || 'Unknown'}</strong>
                  <div className="app-field-note" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <MapPin size={14} color="var(--color-primary)" style={{ marginTop: '1px', flexShrink: 0 }} />
                    <span>{shipment?.pickup_address || 'No pickup details'}</span>
                  </div>
                </div>

                <div className="app-route-metric">
                  <span>Drop</span>
                  <strong style={{ fontSize: '22px' }}>{shipment?.drop_address?.split(',')[0] || 'Unknown'}</strong>
                  <div className="app-field-note" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <MapPin size={14} color="var(--color-success)" style={{ marginTop: '1px', flexShrink: 0 }} />
                    <span>{shipment?.drop_address || 'No drop details'}</span>
                  </div>
                </div>
              </div>

              <div className="app-info-row">
                <div className="app-note-surface" style={{ flex: 1 }}>
                  <strong>Load size:</strong> {((shipment?.weight_kg || 0) / 1000).toFixed(1)} tons
                </div>
                <div className="app-note-surface" style={{ flex: 1 }}>
                  <strong>Status color:</strong> {isCompleted ? 'Delivered' : isCancelled ? 'Cancelled' : 'In review'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <style>{`
        .loader-pulse {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid var(--color-primary);
          border-top-color: transparent;
          animation: history-spin 0.8s linear infinite;
        }

        @keyframes history-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

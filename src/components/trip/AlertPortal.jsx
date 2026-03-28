import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, ShieldAlert, Construction, 
  MapPin, X, Siren, Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

const ALERT_TYPES = [
  { id: 'accident', label: 'Accident', icon: <Siren size={24} />, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { id: 'police', label: 'Police', icon: <ShieldAlert size={24} />, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  { id: 'traffic', label: 'Heavy Traffic', icon: <Clock size={24} />, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  { id: 'construction', label: 'Construction', icon: <Construction size={24} />, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  { id: 'hazard', label: 'Road Hazard', icon: <AlertTriangle size={24} />, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' }
];

export default function AlertPortal({ location, onClose, onSuccess }) {
  const { user } = useStore();

  const handleReport = async (type) => {
    if (!location) return;
    
    try {
      const { error } = await supabase.from('highway_alerts').insert({
        type,
        location: `POINT(${location.lng} ${location.lat})`,
        reported_by: user.id,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      });

      if (error) throw error;
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to report alert:', err);
      alert('Failed to report incident. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 3000,
        background: '#0A0A0F', borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
        padding: '32px 24px 60px', borderTop: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 -20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0 }}>Report Incident</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '4px 0 0' }}>Help other drivers stay safe on the route.</p>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {ALERT_TYPES.map((alert) => (
          <motion.button
            key={alert.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleReport(alert.id)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${alert.color}33`,
              borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '12px', cursor: 'pointer'
            }}
          >
            <div style={{ background: alert.bg, color: alert.color, padding: '12px', borderRadius: '16px' }}>
              {alert.icon}
            </div>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '800' }}>{alert.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

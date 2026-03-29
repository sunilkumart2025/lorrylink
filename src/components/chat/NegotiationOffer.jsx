import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, ShieldCheck } from 'lucide-react';

/**
 * NegotiationOffer: A specialized chat bubble for price proposals.
 * Features: Accept/Reject actions for the receiver.
 */
export default function NegotiationOffer({ offer, isSender, onAccept, onReject }) {
  const { price, weight } = offer.metadata || {};

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        background: 'var(--window-surface)',
        borderRadius: '22px',
        border: '1px solid rgba(59, 130, 246, 0.18)',
        padding: '16px',
        margin: '12px 0',
        width: '100%',
        maxWidth: '280px',
        boxShadow: 'var(--window-shadow)',
        overflow: 'hidden',
        position: 'relative',
        isolation: 'isolate',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.12), transparent 85px), radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 30%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '1px' }}>PRICE PROPOSAL</span>
        <ShieldCheck size={14} color="var(--color-primary)" />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
        <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--color-text-primary)' }}>₹{price?.toLocaleString()}</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>/ total</span>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
        For {weight} Tons • Expected Trip
      </div>

      {!isSender && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onReject}
            style={{ 
              flex: 1, height: '36px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', 
              background: 'rgba(239,68,68,0.05)', color: 'var(--color-error)', fontSize: '11px', fontWeight: '800', cursor: 'pointer' 
            }}
          >
            <X size={14} style={{ marginRight: '4px' }} /> REJECT
          </button>
          <button
            onClick={onAccept}
            style={{ 
              flex: 2, height: '46px', borderRadius: '12px', border: 'none', 
              background: 'linear-gradient(135deg, var(--color-success) 0%, #16A34A 100%)', 
              color: 'white', fontSize: '13px', fontWeight: '900', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(34,197,94,0.3)'
            }}
          >
            <Check size={16} style={{ marginRight: '6px' }} /> ACCEPT & BOOK
          </button>
        </div>
      )}

      {isSender && (
        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
          Awaiting shipper response...
        </div>
      )}
    </motion.div>
  );
}

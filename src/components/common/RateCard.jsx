import React, { useState } from 'react';
import { IndianRupee, Info, CheckCircle, AlertTriangle } from 'lucide-react';

export default function RateCard({ data, onPrimaryAction, primaryLabel }) {
  const [expanded, setExpanded] = useState(false);
  const platformFee = data.fee_pct / 100 * data.gross_rate;
  const gst = platformFee * 0.18;
  const takeHome = data.gross_rate - platformFee - gst;
  const isActionable = typeof onPrimaryAction === 'function';
  const ctaLabel = primaryLabel || (isActionable ? `VIEW & BID (₹${takeHome.toLocaleString()})` : 'PREVIEW ONLY');

  return (
    <div className="card mb-md">
       <div className="flex items-center justify-between mb-sm" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-sm)' }}>
         <h3 style={{ fontSize: '18px', color: 'var(--color-primary)' }}>{data.origin} → {data.destination}</h3>
         <span style={{ fontSize: '14px', background: 'var(--color-success)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>VERIFIED</span>
       </div>
       
       <div className="flex justify-between mb-md" style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
         <span>{data.weight} Tons | {data.requirements}</span>
         <span>★ {data.rating}/5.0</span>
       </div>

       <div style={{ background: 'var(--color-bg)', padding: 'var(--spacing-sm)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--spacing-md)' }}>
         <div className="flex justify-between items-center">
            <span style={{ color: 'var(--color-text-secondary)' }}>Gross Freight Rate:</span>
            <span style={{ fontWeight: 'bold' }}>₹{data.gross_rate.toLocaleString()}</span>
         </div>
         {expanded && (
           <>
            <div className="flex justify-between items-center mt-sm">
                <span className="flex items-center gap-sm" style={{ color: 'var(--color-danger)', fontSize: '14px' }}>Platform Fee ({data.fee_pct}%) <Info size={14} /></span>
                <span style={{ color: 'var(--color-danger)', fontSize: '14px' }}>− ₹{platformFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-sm">
                <span className="flex items-center gap-sm" style={{ color: 'var(--color-danger)', fontSize: '14px' }}>GST on Fee (18%) <Info size={14} /></span>
                <span style={{ color: 'var(--color-danger)', fontSize: '14px' }}>− ₹{gst.toLocaleString()}</span>
            </div>
           </>
         )}
         <div className="flex justify-between items-center mt-md" style={{ borderTop: '2px solid var(--color-border)', paddingTop: '8px' }}>
            <span style={{ fontWeight: 900, color: 'var(--color-success)', fontSize: '18px' }}>TAKE-HOME:</span>
            <span style={{ fontWeight: 900, fontSize: '20px' }}>₹{takeHome.toLocaleString()}</span>
         </div>
       </div>

       <div className="flex justify-center mb-md">
         <button 
           onClick={() => setExpanded(!expanded)} 
           style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '12px', textDecoration: 'underline' }}
         >
           {expanded ? 'Hide Breakup' : 'Show Breakup'}
         </button>
       </div>

       <div className="mb-md" style={{ border: '1px solid var(--color-warning)', padding: 'var(--spacing-sm)', borderRadius: 'var(--border-radius)', fontSize: '14px' }}>
          <strong>PAYMENT TERMS:</strong>
          <ul style={{ marginLeft: 'var(--spacing-md)', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
            <li>40% (₹{(takeHome * 0.4).toFixed(0)}) advance before loading</li>
            <li>60% (₹{(takeHome * 0.6).toFixed(0)}) on proof of delivery</li>
          </ul>
       </div>

       <button
         type="button"
         onClick={onPrimaryAction}
         disabled={!isActionable}
         className="btn btn-primary btn-block"
         style={{ opacity: isActionable ? 1 : 0.65, cursor: isActionable ? 'pointer' : 'default' }}
       >
         {ctaLabel}
       </button>

    </div>
  );
}

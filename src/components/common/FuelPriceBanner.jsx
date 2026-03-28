import React, { useState, useEffect } from 'react';
import { Fuel, TrendingDown, TrendingUp } from 'lucide-react';

export default function FuelPriceBanner() {
  const [prices, setPrices] = useState([
    { city: 'Mumbai', price: 92.14, trend: 'down' },
    { city: 'Delhi', price: 89.62, trend: 'up' },
    { city: 'Chennai', price: 94.24, trend: 'neutral' },
    { city: 'Kolkata', price: 91.76, trend: 'down' }
  ]);

  return (
    <div style={{ 
      overflow: 'hidden', 
      background: 'rgba(255, 255, 255, 0.05)', 
      borderRadius: '12px', 
      padding: '8px 16px',
      marginBottom: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
         <Fuel size={14} />
         <span style={{ fontSize: '12px', fontWeight: 'bold' }}>DIESEL</span>
      </div>
      
      <div className="flex gap-md" style={{ flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {prices.map(p => (
           <div key={p.city} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{p.city}:</span>
              <span style={{ fontWeight: 'bold' }}>₹{p.price}</span>
              {p.trend === 'up' ? <TrendingUp size={10} color="var(--color-danger)" /> : <TrendingDown size={10} color="var(--color-success)" />}
           </div>
        ))}
      </div>
    </div>
  );
}

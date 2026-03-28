import React, { useState } from 'react';
import { Fuel, TrendingDown, TrendingUp, Info } from 'lucide-react';

export default function FuelPriceBanner() {
  const [prices] = useState([
    { city: 'Mumbai', price: 92.14, trend: 'down' },
    { city: 'Delhi', price: 89.62, trend: 'up' },
    { city: 'Chennai', price: 94.24, trend: 'neutral' },
    { city: 'Kolkata', price: 91.76, trend: 'down' }
  ]);

  return (
    <div className="fuel-banner">
      <div className="fuel-banner-brand">
         <Fuel size={18} />
         <span>DIESEL</span>
      </div>
      
      <div className="fuel-banner-track">
        {prices.map(p => (
           <div key={p.city} className="fuel-banner-chip">
              <span className="fuel-banner-city">{p.city}</span>
              <span className="fuel-banner-price">₹{p.price.toFixed(2)}</span>
              {p.trend === 'up' ? (
                <TrendingUp size={14} color="var(--color-error)" />
              ) : (
                <TrendingDown size={14} color="var(--color-success)" />
              )}
           </div>
        ))}
      </div>

      <div className="desktop-only fuel-banner-info">
        <Info size={14} cursor="help" />
      </div>
    </div>
  );
}

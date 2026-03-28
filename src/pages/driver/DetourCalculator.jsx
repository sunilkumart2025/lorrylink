import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Banknote, CheckCircle2, Fuel, Navigation, Route } from 'lucide-react';
import { calculateDetourValue } from '../../lib/routing';

export default function DetourCalculator() {
  const [inputs, setInputs] = useState({
    directKm: 1200,
    detourKm: 1350,
    loadEarning: 15000,
    dieselRate: 95,
    mileage: 4,
  });
  const [results, setResults] = useState(null);

  useEffect(() => {
    setResults(
      calculateDetourValue(
        inputs.directKm,
        inputs.detourKm,
        inputs.loadEarning,
        inputs.dieselRate,
        inputs.mileage
      )
    );
  }, [inputs]);

  const handleSliderChange = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: Number(value) }));
  };

  return (
    <div className="app-page app-page-narrow">
      <div className="card-glass app-surface-hero" style={{ marginBottom: '20px' }}>
        <div className="app-surface-kicker">
          <Route size={14} />
          Detour Value
        </div>
        <h1 className="app-surface-title">Check if the extra load is worth the extra route</h1>
        <p className="app-surface-copy">
          This calculator is now sized like a professional planning tool, with clearer controls, stronger contrast,
          and a cleaner profit readout for quick laptop or mobile decisions.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass app-data-card"
        style={{
          marginBottom: '20px',
          borderColor: results?.isWorthIt ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
        }}
      >
        <div className="app-section-kicker">Projected net gain</div>
        <div
          style={{
            fontSize: '52px',
            fontWeight: '900',
            letterSpacing: '-0.08em',
            color: results?.netGain > 0 ? 'var(--color-success)' : 'var(--color-error)',
          }}
        >
          ₹{results?.netGain?.toLocaleString() || '0'}
        </div>
        <div style={{ marginTop: '10px' }}>
          {results?.isWorthIt ? (
            <div className="badge badge-success" style={{ padding: '8px 14px' }}>
              <CheckCircle2 size={14} /> Go for the detour
            </div>
          ) : (
            <div className="badge badge-warning" style={{ padding: '8px 14px' }}>
              <AlertTriangle size={14} /> Direct route may be better
            </div>
          )}
        </div>
      </motion.div>

      <div className="card-glass app-data-card" style={{ marginBottom: '20px' }}>
        <div className="app-form-grid">
          <ControlItem
            icon={Route}
            label="Direct route"
            value={inputs.directKm}
            unit="km"
            min={100}
            max={3000}
            step={50}
            onChange={(value) => handleSliderChange('directKm', value)}
          />
          <ControlItem
            icon={Navigation}
            label="Detour route"
            value={inputs.detourKm}
            unit="km"
            min={inputs.directKm}
            max={inputs.directKm + 1000}
            step={20}
            onChange={(value) => handleSliderChange('detourKm', value)}
          />
          <ControlItem
            icon={Banknote}
            label="Extra load earning"
            value={inputs.loadEarning}
            unit="₹"
            min={1000}
            max={50000}
            step={500}
            onChange={(value) => handleSliderChange('loadEarning', value)}
          />
        </div>

        <div className="app-form-grid two-up" style={{ marginTop: '18px' }}>
          <div>
            <label className="app-field-label">Diesel rate</label>
            <input
              type="number"
              className="input-field"
              value={inputs.dieselRate}
              onChange={(event) => handleSliderChange('dieselRate', event.target.value)}
            />
          </div>
          <div>
            <label className="app-field-label">Truck mileage (km/L)</label>
            <input
              type="number"
              className="input-field"
              value={inputs.mileage}
              onChange={(event) => handleSliderChange('mileage', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="app-stat-grid">
        <div className="card-glass app-metric-card">
          <div style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Fuel size={16} />
            <h3>Extra fuel cost</h3>
          </div>
          <p>₹{Math.round(results?.extraDieselCost || 0).toLocaleString()}</p>
        </div>
        <div className="card-glass app-metric-card">
          <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Route size={16} />
            <h3>Extra distance</h3>
          </div>
          <p>{results?.extraKm || 0} km</p>
        </div>
      </div>
    </div>
  );
}

function ControlItem({ icon: Icon, label, value, unit, min, max, step, onChange }) {
  const valueLabel = unit === '₹' ? `₹${value.toLocaleString()}` : `${value}${unit}`;

  return (
    <div>
      <div className="app-list-row" style={{ marginBottom: '10px' }}>
        <div className="app-list-main" style={{ gap: '10px' }}>
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
            }}
          >
            <Icon size={16} />
          </div>
          <div className="app-list-copy">
            <div className="app-list-title" style={{ fontSize: '14px' }}>{label}</div>
          </div>
        </div>
        <div className="app-list-value" style={{ color: 'var(--color-primary)' }}>{valueLabel}</div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ width: '100%', accentColor: 'var(--color-primary)' }}
      />
    </div>
  );
}

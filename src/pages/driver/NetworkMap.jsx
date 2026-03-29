import React from 'react';
import ProfitabilityMap from '../../components/maps/ProfitabilityMap';
import { useTranslation } from 'react-i18next';

export default function NetworkMap() {
  const { t } = useTranslation();

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'white', borderBottom: '1px solid #eee' }}>
        <h2 style={{ margin: 0 }}>Live Freight Network</h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Explore high-demand zones across India.
        </p>
      </div>
      
      <div style={{ flex: 1 }}>
        <ProfitabilityMap />
      </div>
    </div>
  );
}

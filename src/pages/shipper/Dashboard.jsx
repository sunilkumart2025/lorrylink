import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, TrendingUp, Zap, CheckCircle, Clock, Truck,
  Plus, ArrowUpRight, BarChart3, Globe, Filter, Search,
  ChevronRight, AlertCircle, Star, IndianRupee, MapPin
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { postShipment } from '../../lib/db/shipments';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import WebpageMap from '../../components/maps/WebpageMap';
import '../../styles/MapTheme.css';

const STATUS_MAP = {
  pending:    { label: 'Pending',    color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  matched:    { label: 'AI Matched', color: 'var(--color-primary)', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  in_transit: { label: 'In Transit', color: 'var(--color-accent)',  bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.3)' },
  delivered:  { label: 'Delivered',  color: 'var(--color-success)', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)'  },
};

const truckIcon = L.divIcon({
  className: 'driver-marker-wrapper',
  html: `<div class="truck-pin" style="background:var(--map-accent); border-color:white; transform:scale(0.8)"><svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13.5-8.5l1.96 2.5H17V9.5h2.5zM18 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"></path></svg></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

function KpiCard({ icon, label, value, sub, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: 'rgba(17,24,39,0.7)',
        backdropFilter: 'blur(12px)',
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: '16px',
        padding: '20px',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={{ borderColor: 'rgba(59,130,246,0.4)', boxShadow: '0 8px 30px rgba(59,130,246,0.12)', y: -2 }}
    >
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: `${color}15`, filter: 'blur(30px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ background: `${color}18`, padding: '8px', borderRadius: '10px' }}>
          {React.cloneElement(icon, { size: 18, color })}
        </div>
        <ArrowUpRight size={14} color="rgba(255,255,255,0.2)" />
      </div>
      <div style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color, marginTop: '4px', fontWeight: '600' }}>{sub}</div>}
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '9999px',
      fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      ...(status === 'matched' ? { boxShadow: `0 0 8px rgba(59,130,246,0.4)` } : {})
    }}>
      {status === 'matched' && '⚡ '}{s.label}
    </span>
  );
}

function QuickPostForm({ onClose }) {
  const { user } = useStore();
  const [form, setForm] = useState({ pickup: '', drop: '', weight: '', price: '' });
  const [posting, setPosting] = useState(false);
  const [done, setDone] = useState(false);

  const handlePost = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      // Switch from Google Geocoding to Nominatim (OSM)
      const fetchLoc = async (address) => {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await res.json();
        return data[0] ? `POINT(${data[0].lon} ${data[0].lat})` : null;
      };

      const pLoc = await fetchLoc(form.pickup);
      const dLoc = await fetchLoc(form.drop);

      const { error } = await postShipment({
        business_id: user?.id,
        pickup_address: form.pickup,
        drop_address: form.drop,
        pickup_location: pLoc,
        drop_location: dLoc,
        weight_kg: Math.round(parseFloat(form.weight) * 1000),
        price: parseFloat(form.price),
        status: 'pending',
        is_partial: false,
      });
      if (error) throw error;
      setDone(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error("Geocoding or Insert Error:", err);
      setPosting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '20px'
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: '460px', background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', position: 'relative' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>Post New Shipment</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>AI will instantly match your cargo to available trucks</p>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: 'var(--color-success)' }}>Shipment Posted!</h3>
          </div>
        ) : (
          <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input required className="input-field" placeholder="Pickup Location" value={form.pickup} onChange={e => setForm(p => ({ ...p, pickup: e.target.value }))} />
            <input required className="input-field" placeholder="Drop Location" value={form.drop} onChange={e => setForm(p => ({ ...p, drop: e.target.value }))} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <input required type="number" className="input-field" placeholder="Weight (Tons)" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
              <input required type="number" className="input-field" placeholder="Budget (₹)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <button type="submit" disabled={posting} className="btn btn-primary" style={{ height: '48px', marginTop: '8px' }}>
              {posting ? 'Processing...' : 'Post & Match Now'}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}

export default function ShipperDashboard() {
  const { user } = useStore();
  const [showPost, setShowPost] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTrucks, setActiveTrucks] = useState({});
  const [selectedTruck, setSelectedTruck] = useState(null);

  useEffect(() => {
    const parseWKT = (wkt) => {
      if (!wkt) return null;
      if (typeof wkt === 'string') {
        const m = wkt.match(/POINT\(([^ ]+)\s+([^)]+)\)/);
        return m ? { lng: parseFloat(m[1]), lat: parseFloat(m[2]) } : null;
      }
      return wkt.coordinates ? { lng: wkt.coordinates[0], lat: wkt.coordinates[1] } : null;
    };

    const fetchInitial = async () => {
      const { data } = await supabase.from('tracking').select('*');
      if (data) {
        const mapped = {};
        data.forEach(t => { 
          const loc = parseWKT(t.location);
          if (loc) mapped[t.booking_id] = { ...t, ...loc };
        });
        setActiveTrucks(mapped);
      }
    };
    fetchInitial();

    const sub = supabase.channel('public:tracking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracking' }, payload => {
        const t = payload.new;
        const loc = parseWKT(t.location);
        if (loc) setActiveTrucks(prev => ({ ...prev, [t.booking_id]: { ...t, ...loc } }));
      }).subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  useRealtimeSync('shipments', 'shipper-shipments', `business_id=eq.${user?.id}`);

  const { data: shipments, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['shipper-shipments', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('shipments').select('*').eq('business_id', user.id);
      return data || [];
    },
    enabled: !!user?.id
  });

  const filtered = (shipments || []).filter(s => {
    const matchSearch = (s.pickup_address?.toLowerCase() || '').includes(search.toLowerCase()) || (s.drop_address?.toLowerCase() || '').includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpis = [
    { icon: <Package />, label: 'Active Shipments', value: shipments?.filter(s => s.status !== 'delivered').length || '0', sub: 'Live', color: '#3B82F6', delay: 0 },
    { icon: <Zap />, label: 'AI Matched', value: shipments?.filter(s => s.status === 'matched').length || '0', sub: 'Optimized', color: '#22D3EE', delay: 0.05 },
    { icon: <IndianRupee />, label: 'Total Spend', value: `₹${((shipments?.reduce((sum, s) => sum + (s.price || 0), 0) || 0) / 100000).toFixed(1)}L`, sub: 'Lifetime', color: '#22C55E', delay: 0.1 },
    { icon: <Star />, label: 'Avg Score', value: '92%', sub: 'High accuracy', color: '#F59E0B', delay: 0.15 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: 'white' }}>
      <header style={{ background: 'rgba(17,24,39,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={18} color="white" />
          </div>
          <span style={{ fontWeight: '900', fontSize: '18px' }}>LoadLink<span style={{ color: '#3B82F6' }}>.</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Control Tower</div>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '4px' }}>Control Center</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>Real-time fleet intelligence powered by WebpageMap.</p>
          </div>
          <button onClick={() => setShowPost(true)} className="btn btn-primary" style={{ height: '48px', padding: '0 24px' }}><Plus size={16} /> Post New Shipment</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
        </div>

        {/* Live Map */}
        <div style={{ background: 'rgba(17,24,39,0.7)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '32px' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
             <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Live Fleet Tracking</h3>
             <span style={{ fontSize: '12px', color: '#22D3EE', fontWeight: '800' }}>OSM SAT-SYNCHED</span>
          </div>
          <div style={{ height: '400px', width: '100%', position: 'relative' }}>
             <WebpageMap center={[21.0, 78.0]} zoom={5}>
                {Object.values(activeTrucks).map(t => (
                  <Marker
                    key={t.booking_id}
                    position={[t.lat, t.lng]}
                    icon={truckIcon}
                  >
                    <Popup>
                       <div style={{ color: 'white', padding: '8px' }}>
                        <strong>Booking {t.booking_id.slice(0,8)}</strong>
                        <div style={{ fontSize: '12px' }}>Speed: {Math.round(t.speed * 3.6)} km/h</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
             </WebpageMap>
          </div>
        </div>

        {/* Shipments Table */}
        <div style={{ background: 'rgba(17,24,39,0.7)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Active Pipeline</h3>
            <input placeholder="Search routes..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 16px', color: 'white', fontSize: '13px' }} />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Route', 'Budget', 'Status', ''].map(h => <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: '700' }}>{s.pickup_address}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>to {s.drop_address}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>₹{s.price?.toLocaleString()}</td>
                  <td style={{ padding: '16px 24px' }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: '16px 24px' }}><ChevronRight size={16} color="rgba(255,255,255,0.2)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showPost && <QuickPostForm onClose={() => setShowPost(false)} />}
      </AnimatePresence>
    </div>
  );
}

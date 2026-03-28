import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Mic, Send, Navigation2, Fuel, 
  TrendingUp, Truck, Weight, Calendar, Plus, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { useTranslation } from 'react-i18next';

export default function PostEmptyTruck() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setActivePost } = useStore();
  const [destination, setDestination] = useState('');
  const [truckType, setTruckType] = useState('22-Wheeler');
  const [capacity, setCapacity] = useState(25);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [originCity, setOriginCity] = useState('Locating...');
  const [originCoords, setOriginCoords] = useState([80.2707, 13.0827]);

  const vehicleTypes = ['14-Wheeler', '22-Wheeler', 'Tailer', 'Container'];

  // ── Fetch Driver Location & Vehicle ────────────────────────────────────────
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOriginCoords([pos.coords.longitude, pos.coords.latitude]);
          setOriginCity('My Current Location');
        },
        () => setOriginCity('Chennai, Tamil Nadu'),
        { enableHighAccuracy: true }
      );
    }

    const fetchTruck = async () => {
      const { data } = await supabase.from('trucks').select('*').eq('driver_id', user.id).limit(1).maybeSingle();
      if (data) {
        setTruckType(data.vehicle_type);
        setCapacity(data.capacity_kg / 1000);
      }
    };
    if (user?.id) fetchTruck();
  }, [user?.id]);

  // ── Voice Search Implementation ────────────────────────────────────────────
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search not supported on this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') alert('Please enable microphone access.');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const cleanText = transcript.replace(/to |heading to |going to |for /gi, '').trim();
      setDestination(cleanText.charAt(0).toUpperCase() + cleanText.slice(1));
    };
    recognition.start();
  };

  const handleMatch = async () => {
    setLoading(true);
    
    let destCoords = [73.8567, 18.5204]; // Default Pune
    
    // ── Nominatim Geocoding (Spelling Mistake / Fuzzy Handling) ─────────────
    try {
      if (destination) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`);
        const json = await res.json();
        if (json && json[0]) {
          destCoords = [parseFloat(json[0].lon), parseFloat(json[0].lat)];
          console.log(`Geocoded ${destination} to:`, destCoords);
        }
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }

    const { data: truck } = await supabase.from('trucks').select('id').eq('driver_id', user.id).limit(1).maybeSingle();

    const { data, error } = await supabase
      .from('routes')
      .insert([
        {
          truck_id: truck?.id || '00000000-0000-0000-0000-000000000000',
          origin: originCity === 'Locating...' ? 'Chennai' : originCity,
          destination: destination || "Pune",
          origin_location: `POINT(${originCoords[0]} ${originCoords[1]})`,
          destination_location: `POINT(${destCoords[0]} ${destCoords[1]})`,
          departure_time: new Date().toISOString(),
          expected_arrival: new Date(Date.now() + 86400000 * 2).toISOString(),
          available_capacity_kg: capacity * 1000,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (data || !error) {
      if (data) setActivePost({ ...data, destCoords });
      navigate('/driver/matches');
    } else {
      console.error("Error posting route:", error.message);
      navigate('/driver/matches');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '-1px' }}
        >
          {t('post.title')}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}
        >
          {t('post.sub')}
        </motion.p>
      </header>

      {/* ── Route Config ────────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-glass" 
        style={{ padding: '28px', borderRadius: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--color-primary)' }}></div>
        
        {/* Origin */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '40px' }}>
           <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <MapPin size={22} />
           </div>
           <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: '800' }}>{t('post.origin')}</label>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginTop: '4px' }}>{originCity}</div>
           </div>
        </div>

        {/* Connector Line */}
        <div style={{ position: 'absolute', left: '50px', top: '72px', width: '2px', height: '40px', background: 'linear-gradient(to bottom, var(--color-primary), rgba(255,255,255,0.1))' }}></div>

        {/* Destination */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
           <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
              <Navigation2 size={22} />
           </div>
           <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: '800' }}>{t('post.destination')}</label>
              <div style={{ position: 'relative', marginTop: '4px' }}>
                <input 
                  type="text" 
                  placeholder={t('post.destination')}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '18px', fontWeight: '800', outline: 'none', padding: '4px 0' }}
                />
                <motion.button 
                  onClick={toggleVoice}
                  animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                  transition={isListening ? { repeat: Infinity, duration: 1 } : {}}
                  style={{ position: 'absolute', right: 0, top: '4px', background: 'none', border: 'none', cursor: 'pointer', color: isListening ? 'var(--color-danger)' : 'var(--color-primary)' }}
                >
                  <Mic size={18} />
                </motion.button>
              </div>
           </div>
        </div>
      </motion.div>

      {/* ── Vehicle Detail ───────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ marginBottom: '32px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
           <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>VEHICLE & CAPACITY</h3>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '12px', fontWeight: '800' }}>
              <Truck size={14} /> My Profile
           </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
           {vehicleTypes.map(t => (
             <button
               key={t}
               onClick={() => setTruckType(t)}
               style={{
                 padding: '12px 20px', borderRadius: '14px', whiteSpace: 'nowrap', border: truckType === t ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                 background: truckType === t ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                 color: truckType === t ? 'var(--color-primary)' : 'rgba(255,255,255,0.4)',
                 fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.3s'
               }}
             >
               {t}
             </button>
           ))}
        </div>

        <div className="flex gap-md">
           <div className="card-glass" style={{ flex: 1, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                 <Weight size={16} color="var(--color-warning)" />
                 <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase' }}>Available Tons</span>
              </div>
              <input 
                type="number" 
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', fontWeight: '900', outline: 'none', width: '100%' }}
              />
           </div>
           <div className="card-glass" style={{ flex: 1, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                 <Calendar size={16} color="var(--color-accent)" />
                 <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase' }}>Departure</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>Immediate</div>
           </div>
        </div>
      </motion.div>

      {/* ── Profit Estimator ────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-md mb-xl"
      >
         <div className="card-glass" style={{ flex: 1, padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <Fuel size={24} color="var(--color-warning)" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px', fontWeight: '800' }}>DIESEL ESTIMATE</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>₹32,400</div>
         </div>
         <div className="card-glass" style={{ flex: 1, padding: '20px', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.2)', background: 'rgba(34, 197, 94, 0.02)' }}>
            <TrendingUp size={24} color="var(--color-success)" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px', fontWeight: '800' }}>POTENTIAL PROFIT</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-success)' }}>+ ₹12,800</div>
         </div>
      </motion.div>

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn btn-primary btn-block" 
        onClick={handleMatch}
        disabled={loading}
        style={{ height: '72px', fontSize: '18px', fontWeight: '900', borderRadius: '20px', boxShadow: '0 10px 40px rgba(59,130,246,0.3)' }}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div className="loader-pulse" style={{ width: '12px', height: '12px' }}></div>
             SIGNALING NETWORK...
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
             <Send size={24} /> FIND OPTIMAL LOADS
          </div>
        )}
      </motion.button>
      
      <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: '600' }}>
         Instant matching with <span style={{ color: 'var(--color-primary)' }}>500+ shippers</span> in your corridor.
      </p>
    </div>
  );
}

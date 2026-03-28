import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Fuel,
  MapPin,
  Mic,
  Navigation2,
  Send,
  TrendingUp,
  Truck,
  Weight,
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

    let destCoords = [73.8567, 18.5204];

    try {
      if (destination) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`);
        const json = await res.json();
        if (json && json[0]) {
          destCoords = [parseFloat(json[0].lon), parseFloat(json[0].lat)];
        }
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
    }

    const { data: truck } = await supabase.from('trucks').select('id').eq('driver_id', user.id).limit(1).maybeSingle();

    const { data, error } = await supabase
      .from('routes')
      .insert([
        {
          truck_id: truck?.id || '00000000-0000-0000-0000-000000000000',
          origin: originCity === 'Locating...' ? 'Chennai' : originCity,
          destination: destination || 'Pune',
          origin_location: `POINT(${originCoords[0]} ${originCoords[1]})`,
          destination_location: `POINT(${destCoords[0]} ${destCoords[1]})`,
          departure_time: new Date().toISOString(),
          expected_arrival: new Date(Date.now() + 86400000 * 2).toISOString(),
          available_capacity_kg: capacity * 1000,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (data || !error) {
      if (data) setActivePost({ ...data, destCoords });
      navigate('/driver/matches');
    } else {
      console.error('Error posting route:', error.message);
      navigate('/driver/matches');
    }

    setLoading(false);
  };

  return (
    <div className="app-page app-page-narrow">
      <div className="card-glass app-surface-hero" style={{ marginBottom: '20px' }}>
        <div className="app-surface-kicker">
          <Truck size={14} />
          Truck Availability
        </div>
        <h1 className="app-surface-title">{t('post.title')}</h1>
        <p className="app-surface-copy">
          Publish the next open lane with a calmer layout, cleaner field sizing, and quick voice input for dispatch-speed posting.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="card-glass app-data-card" style={{ marginBottom: '20px' }}>
        <div className="app-section-kicker">Route setup</div>
        <div className="app-form-grid">
          <div>
            <label className="app-field-label">{t('post.origin')}</label>
            <div className="app-route-metric">
              <span>Detected origin</span>
              <strong style={{ fontSize: '24px' }}>{originCity}</strong>
            </div>
          </div>

          <div>
            <label className="app-field-label">{t('post.destination')}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder={t('post.destination')}
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                style={{ paddingRight: '58px', minHeight: '58px', fontSize: '16px', fontWeight: '700' }}
              />
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={toggleVoice}
                className="app-icon-button"
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isListening ? 'var(--color-error)' : 'var(--color-primary)',
                }}
              >
                <Mic size={18} />
              </motion.button>
            </div>
            <div className="app-field-note">Voice destination search stays available for fast roadside posting.</div>
          </div>
        </div>
      </motion.div>

      <div className="card-glass app-data-card" style={{ marginBottom: '20px' }}>
        <div className="app-page-header" style={{ marginBottom: '14px' }}>
          <div className="app-title-wrap">
            <h2 className="app-page-title" style={{ fontSize: '1.35rem' }}>Vehicle and capacity</h2>
            <p className="app-page-subtitle">Sized for quick taps on mobile and laptop.</p>
          </div>
        </div>

        <div className="app-scroll-strip" style={{ marginBottom: '18px' }}>
          {vehicleTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTruckType(type)}
              className={`app-option-pill${truckType === type ? ' is-active' : ''}`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="app-panel-grid two-up">
          <div className="app-route-metric">
            <span>Available tons</span>
            <strong>{capacity}</strong>
            <div className="app-field-note" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Weight size={14} color="var(--color-warning)" /> Update your open capacity in tons
            </div>
            <input
              type="number"
              className="input-field"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              style={{ marginTop: '14px' }}
            />
          </div>

          <div className="app-route-metric">
            <span>Departure</span>
            <strong style={{ fontSize: '24px' }}>Immediate</strong>
            <div className="app-field-note" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={14} color="var(--color-accent)" /> Ready for instant marketplace matching
            </div>
          </div>
        </div>
      </div>

      <div className="app-stat-grid" style={{ marginBottom: '20px' }}>
        <div className="card-glass app-metric-card">
          <div style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Fuel size={16} />
            <h3>Diesel estimate</h3>
          </div>
          <p>₹32.4K</p>
        </div>
        <div className="card-glass app-metric-card">
          <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} />
            <h3>Potential profit</h3>
          </div>
          <p>₹12.8K</p>
        </div>
      </div>

      <div className="app-note-surface" style={{ marginBottom: '18px' }}>
        <strong>{originCity}</strong> to <strong>{destination || 'your next lane'}</strong> will be published with your selected truck
        type and available payload.
      </div>

      <button
        onClick={handleMatch}
        disabled={loading}
        className="app-button is-primary is-block"
        style={{ minHeight: '64px', fontSize: '16px' }}
      >
        {loading ? (
          <>
            <div className="loader-pulse" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
            Signaling network
          </>
        ) : (
          <>
            <Send size={18} />
            Find optimal loads
          </>
        )}
      </button>

      <div className="app-info-row" style={{ marginTop: '18px' }}>
        <div className="app-note-surface" style={{ flex: 1 }}>
          <MapPin size={14} color="var(--color-primary)" style={{ marginRight: '8px' }} />
          Posting uses your current location whenever GPS is available.
        </div>
        <div className="app-note-surface" style={{ flex: 1 }}>
          <Navigation2 size={14} color="var(--color-accent)" style={{ marginRight: '8px' }} />
          Voice capture remains active for destination entry.
        </div>
      </div>

      <style>{`
        .loader-pulse {
          border-style: solid;
          border-color: rgba(255,255,255,0.7);
          border-top-color: transparent;
          border-radius: 50%;
          animation: post-truck-spin 0.8s linear infinite;
        }

        @keyframes post-truck-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

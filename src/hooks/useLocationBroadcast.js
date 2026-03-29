import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export function useLocationBroadcast() {
  const { user } = useStore();

  useEffect(() => {
    if (!user || user.role !== 'driver') return;

    let watchId;

    const startBroadcast = async () => {
      // Driver identification
      const deviceId = user.id;

      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          try {
            const { error } = await supabase
              .from('user_locations')
              .upsert(
                {
                  device_id: deviceId,
                  latitude,
                  longitude,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'device_id' }
              );

            if (error) console.error('broadcast failed:', error.message);
          } catch (err) {
            console.error('Location sync error:', err);
          }
        },
        (err) => console.error('gps error:', err.message),
        { 
          enableHighAccuracy: true, 
          maximumAge: 15000, 
          timeout: 10000 
        }
      );
    };

    startBroadcast();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);
}

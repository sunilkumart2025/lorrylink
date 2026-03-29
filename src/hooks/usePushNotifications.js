import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { isHeadingHome } from '../lib/homeRoute';

export function usePushNotifications() {
  const { user } = useStore();

  useEffect(() => {
    // Only listen for drivers who are logged in
    if (!user || !user.id || user.role !== 'driver') return;

    // Request browser notification permissions on load
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const homeCity = user.home_city || 'Chennai'; // Fallback for demo

    // Subscribe to new shipments
    const channel = supabase.channel('realtime_shipments')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'shipments',
        filter: "status=eq.pending" // only new/pending shipments
      }, (payload) => {
        const shipment = payload.new;
        
        // If the shipment is heading home, fire a push notification
        if (isHeadingHome({ drop_address: shipment.drop_address }, homeCity)) {
          if (Notification.permission === 'granted') {
            const body = `${shipment.is_partial ? 'Part Load' : 'Full Load'} (${(shipment.weight_kg / 1000).toFixed(1)}T) heading to ${shipment.drop_address?.split(',')[0]}. Pays ₹${shipment.price}.`;
            
            const notification = new Notification('New Matching Load! 🚛', {
              body,
              icon: '/icon-192.png',
              vibrate: [200, 100, 200]
            });

            notification.onclick = () => {
              window.focus();
              // In a real app we might route to the exact load detail via URL
            };
          }
        }
      })
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);
}

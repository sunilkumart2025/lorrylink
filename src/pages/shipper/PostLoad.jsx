import React, { useState } from 'react';
import { IndianRupee, MapPin, Truck, Box, Send } from 'lucide-react';
import RateCard from '../../components/common/RateCard';
import { postShipment } from '../../lib/db/shipments';
import { useStore } from '../../store/useStore';

export default function PostLoad() {
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    weight: 18,
    truckType: '22-Wheeler',
    price: 52000
  });

  const handlePostLoad = async () => {
    setLoading(true);
    
    // Mock coordinates for demo (Ideally from Map autocomplete)
    const pickupCoords = [80.2707, 13.0827]; 
    const dropCoords = [73.8567, 18.5204];

    const { error } = await postShipment({
      business_id: user?.id || 'bus-1', // Make sure user.id is set properly in Prod
      pickup_address: formData.origin,
      drop_address: formData.destination,
      pickup_location: `POINT(${pickupCoords[0]} ${pickupCoords[1]})`,
      drop_location: `POINT(${dropCoords[0]} ${dropCoords[1]})`,
      weight_kg: formData.weight * 1000,
      price: formData.price,
      status: 'pending'
    });

    if (!error) {
      alert("Shipment posted successfully!");
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const previewData = {
    origin: formData.origin || 'Origin',
    destination: formData.destination || 'Destination',
    weight: formData.weight,
    requirements: formData.truckType,
    gross_rate: formData.price,
    fee_pct: 2,
    rating: 4.5
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '900px', margin: '0 auto' }}>
      <h1 className="mb-xl">Post a New Shipment</h1>
      
      <div className="flex gap-xl">
        {/* Form Side */}
        <div style={{ flex: 1 }}>
          <div className="card">
            <h3 className="mb-md">Shipment Details</h3>
            <div className="mb-md">
              <label style={{ display: 'block', fontWeight: 'bold' }}>Pickup Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={20} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--color-primary)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }} 
                  placeholder="City, State" 
                  value={formData.origin}
                  onChange={e => setFormData({ ...formData, origin: e.target.value })}
                />
              </div>
            </div>
            <div className="mb-md">
              <label style={{ display: 'block', fontWeight: 'bold' }}>Drop-off Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={20} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--color-success)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }} 
                  placeholder="City, State" 
                  value={formData.destination}
                  onChange={e => setFormData({ ...formData, destination: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-md mb-md">
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 'bold' }}>Weight (Tons)</label>
                    <input 
                        type="number" 
                        className="input-field" 
                        value={formData.weight}
                        onChange={e => setFormData({ ...formData, weight: e.target.value })}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 'bold' }}>Offering Rate (₹)</label>
                    <input 
                        type="number" 
                        className="input-field" 
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                </div>
            </div>

            <button className="btn btn-primary btn-block">
               <Send size={20} style={{ marginRight: '8px' }} /> POST LOAD LIVE
            </button>
          </div>
        </div>

        {/* Preview Side */}
        <div style={{ flex: 1 }}>
           <h3 className="mb-md">How Drivers Will See This</h3>
           <RateCard data={previewData} />
           <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              Transparency matters. We show drivers the exact breakdown including GST.
           </div>
        </div>
      </div>
    </div>
  );
}
